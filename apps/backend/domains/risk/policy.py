from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Any

from django.core.exceptions import ValidationError

DECISIONS = ("ALLOW", "CHALLENGE", "HOLD", "BLOCK")
_RANK = {decision: rank for rank, decision in enumerate(DECISIONS)}


def max_decision(a: str, b: str) -> str:
    return a if _RANK[a] >= _RANK[b] else b


def _decimal(value: Any, field: str) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError) as exc:
        raise ValidationError(f"{field} must be a decimal value.") from exc


def _decision(value: Any, field: str) -> str:
    if value not in DECISIONS:
        raise ValidationError(f"{field} must be one of {DECISIONS}, got {value!r}.")
    return value


@dataclass(frozen=True)
class ScoreBand:
    decision: str
    min_score: Decimal
    max_score: Decimal
    reason_code: str


@dataclass(frozen=True)
class RiskPolicyConfig:
    """A structured, validated risk policy configuration.

    Deliberately data-only: no expressions, no eval(). Combining evidence is
    done entirely by the fixed interpreter in `apply_policy`.
    """

    hard_block_severities: tuple[str, ...]
    hard_hold_severities: tuple[str, ...]
    hard_block_score: Decimal
    hard_hold_score: Decimal
    hard_override_confidence: Decimal
    model_bands: tuple[ScoreBand, ...]
    missing_rules_decision: str
    missing_model_decision: str
    missing_model_score: Decimal
    min_profile_completeness: Decimal | None
    low_completeness_decision: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> RiskPolicyConfig:
        if not isinstance(data, dict):
            raise ValidationError("Policy configuration must be an object.")
        try:
            hard_block_severities = tuple(data["hard_block_severities"])
            hard_hold_severities = tuple(data["hard_hold_severities"])
            raw_bands = data["model_bands"]
            missing_rules_decision = _decision(
                data["missing_rules_decision"], "missing_rules_decision"
            )
            missing_model_decision = _decision(
                data["missing_model_decision"], "missing_model_decision"
            )
            low_completeness_decision = _decision(
                data["low_completeness_decision"], "low_completeness_decision"
            )
            missing_model_score = _decimal(data["missing_model_score"], "missing_model_score")
            hard_block_score = _decimal(data["hard_block_score"], "hard_block_score")
            hard_hold_score = _decimal(data["hard_hold_score"], "hard_hold_score")
            hard_override_confidence = _decimal(
                data["hard_override_confidence"], "hard_override_confidence"
            )
        except KeyError as exc:
            raise ValidationError(f"Policy configuration is missing required key: {exc}") from exc

        if not raw_bands:
            raise ValidationError("Policy configuration requires at least one model band.")
        bands: list[ScoreBand] = []
        for raw_band in raw_bands:
            band = ScoreBand(
                decision=_decision(raw_band["decision"], "model_bands.decision"),
                min_score=_decimal(raw_band["min_score"], "model_bands.min_score"),
                max_score=_decimal(raw_band["max_score"], "model_bands.max_score"),
                reason_code=raw_band["reason_code"],
            )
            if band.min_score > band.max_score:
                raise ValidationError("Model band min_score must not exceed max_score.")
            bands.append(band)

        min_completeness_raw = data.get("min_profile_completeness")
        min_completeness = (
            _decimal(min_completeness_raw, "min_profile_completeness")
            if min_completeness_raw is not None
            else None
        )

        return cls(
            hard_block_severities=hard_block_severities,
            hard_hold_severities=hard_hold_severities,
            hard_block_score=hard_block_score,
            hard_hold_score=hard_hold_score,
            hard_override_confidence=hard_override_confidence,
            model_bands=tuple(bands),
            missing_rules_decision=missing_rules_decision,
            missing_model_decision=missing_model_decision,
            missing_model_score=missing_model_score,
            min_profile_completeness=min_completeness,
            low_completeness_decision=low_completeness_decision,
        )

    def band_for_score(self, score: Decimal) -> ScoreBand:
        for band in self.model_bands:
            if band.min_score <= score <= band.max_score:
                return band
        return max(self.model_bands, key=lambda band: _RANK[band.decision])


# Reference/development configuration only. These thresholds demonstrate the
# policy shape (hard-rule override, model-score bands, evidence-completeness
# handling) and are NOT a validated lending or fraud policy.
DEFAULT_CONFIGURATION: dict[str, Any] = {
    "hard_block_severities": ["CRITICAL"],
    "hard_hold_severities": ["HIGH"],
    "hard_block_score": "1000",
    "hard_hold_score": "900",
    "hard_override_confidence": "1",
    "model_bands": [
        {
            "decision": "BLOCK",
            "min_score": "900",
            "max_score": "1000",
            "reason_code": "MODEL_HIGH_RISK",
        },
        {
            "decision": "HOLD",
            "min_score": "700",
            "max_score": "899.9999",
            "reason_code": "MODEL_HIGH_RISK",
        },
        {
            "decision": "CHALLENGE",
            "min_score": "400",
            "max_score": "699.9999",
            "reason_code": "MODEL_MODERATE_RISK",
        },
        {
            "decision": "ALLOW",
            "min_score": "0",
            "max_score": "399.9999",
            "reason_code": "MODEL_LOW_RISK",
        },
    ],
    "missing_rules_decision": "CHALLENGE",
    "missing_model_decision": "CHALLENGE",
    "missing_model_score": "500",
    "min_profile_completeness": "1",
    "low_completeness_decision": "CHALLENGE",
}


@dataclass(frozen=True)
class RiskEvidence:
    rule_results: tuple[Any, ...] | None
    model_score: Decimal | None
    model_confidence: Decimal | None
    profile_completeness: Decimal | None


@dataclass(frozen=True)
class RiskOutcome:
    decision: str
    score: Decimal
    confidence: Decimal
    reasons: tuple[dict[str, Any], ...]


def apply_policy(config: RiskPolicyConfig, evidence: RiskEvidence) -> RiskOutcome:
    reasons: list[dict[str, Any]] = []

    if evidence.rule_results is not None:
        matched = [result for result in evidence.rule_results if result.matched]
        for result in matched:
            if result.severity in config.hard_block_severities:
                return RiskOutcome(
                    decision="BLOCK",
                    score=config.hard_block_score,
                    confidence=config.hard_override_confidence,
                    reasons=(
                        {"code": result.reason_code, "source": "RULE", "severity": result.severity},
                    ),
                )
        for result in matched:
            reasons.append(
                {"code": result.reason_code, "source": "RULE", "severity": result.severity}
            )
        if any(result.severity in config.hard_hold_severities for result in matched):
            return RiskOutcome(
                decision="HOLD",
                score=config.hard_hold_score,
                confidence=config.hard_override_confidence,
                reasons=tuple(reasons),
            )
    else:
        reasons.append({"code": "RULES_UNAVAILABLE", "source": "EVIDENCE", "severity": ""})

    decision = "ALLOW"
    if evidence.rule_results is None:
        decision = max_decision(decision, config.missing_rules_decision)

    if evidence.profile_completeness is None or (
        config.min_profile_completeness is not None
        and evidence.profile_completeness < config.min_profile_completeness
    ):
        reasons.append({"code": "LOW_PROFILE_COMPLETENESS", "source": "EVIDENCE", "severity": ""})
        decision = max_decision(decision, config.low_completeness_decision)

    if evidence.model_score is None:
        reasons.append({"code": "MODEL_UNAVAILABLE", "source": "EVIDENCE", "severity": ""})
        decision = max_decision(decision, config.missing_model_decision)
        score = config.missing_model_score
        confidence = Decimal("0")
    else:
        band = config.band_for_score(evidence.model_score)
        reasons.append({"code": band.reason_code, "source": "MODEL", "severity": ""})
        decision = max_decision(decision, band.decision)
        score = evidence.model_score
        confidence = (
            evidence.model_confidence if evidence.model_confidence is not None else Decimal("0")
        )

    if not reasons:
        reasons.append({"code": "INSUFFICIENT_EVIDENCE", "source": "POLICY", "severity": ""})

    return RiskOutcome(
        decision=decision, score=score, confidence=confidence, reasons=tuple(reasons)
    )
