from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Any

from django.core.exceptions import ValidationError


def _decimal(value: Any, field: str) -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError) as exc:
        raise ValidationError(f"{field} must be a decimal value.") from exc


@dataclass(frozen=True)
class ComponentWeight:
    code: str
    weight: Decimal


@dataclass(frozen=True)
class ConfidenceBand:
    band: str
    min_score: Decimal
    max_score: Decimal


@dataclass(frozen=True)
class FinancialConfidenceConfig:
    """Structured, validated confidence-scoring configuration. Data only:
    no expressions, no eval()."""

    components: tuple[ComponentWeight, ...]
    bands: tuple[ConfidenceBand, ...]

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> FinancialConfidenceConfig:
        if not isinstance(data, dict):
            raise ValidationError("Confidence configuration must be an object.")
        try:
            raw_components = data["components"]
            raw_bands = data["bands"]
        except KeyError as exc:
            raise ValidationError(
                f"Confidence configuration is missing required key: {exc}"
            ) from exc

        if not raw_components:
            raise ValidationError("Confidence configuration requires at least one component.")
        components = tuple(
            ComponentWeight(code=raw["code"], weight=_decimal(raw["weight"], "components.weight"))
            for raw in raw_components
        )
        if sum(component.weight for component in components) <= 0:
            raise ValidationError("Component weights must sum to a positive value.")

        if not raw_bands:
            raise ValidationError("Confidence configuration requires at least one band.")
        bands = []
        for raw in raw_bands:
            band = ConfidenceBand(
                band=raw["band"],
                min_score=_decimal(raw["min_score"], "bands.min_score"),
                max_score=_decimal(raw["max_score"], "bands.max_score"),
            )
            if band.min_score > band.max_score:
                raise ValidationError("Confidence band min_score must not exceed max_score.")
            bands.append(band)

        return cls(components=components, bands=tuple(bands))

    def band_for_score(self, score: Decimal) -> str:
        for band in self.bands:
            if band.min_score <= score <= band.max_score:
                return band.band
        return self.bands[-1].band if score > self.bands[-1].max_score else self.bands[0].band


# Reference/development configuration only.
DEFAULT_CONFIGURATION: dict[str, Any] = {
    "components": [
        {"code": "profile_completeness", "weight": "0.25"},
        {"code": "account_coverage", "weight": "0.20"},
        {"code": "cashflow_consistency", "weight": "0.20"},
        {"code": "savings_behaviour", "weight": "0.20"},
        {"code": "transaction_history_depth", "weight": "0.15"},
    ],
    "bands": [
        {"band": "BUILDING", "min_score": "0", "max_score": "39.9999"},
        {"band": "FAIR", "min_score": "40", "max_score": "59.9999"},
        {"band": "GOOD", "min_score": "60", "max_score": "79.9999"},
        {"band": "STRONG", "min_score": "80", "max_score": "100"},
    ],
}


@dataclass(frozen=True)
class ComponentInput:
    code: str
    value: Decimal | None
    available: bool
    unavailable_reason: str = ""


@dataclass(frozen=True)
class ConfidenceOutcome:
    score: Decimal
    band: str
    completeness: Decimal
    components: tuple[ComponentInput, ...]


def apply_confidence_policy(
    config: FinancialConfidenceConfig, inputs: dict[str, ComponentInput]
) -> ConfidenceOutcome:
    total_weight = sum(component.weight for component in config.components)
    available_weight = Decimal("0")
    weighted_sum = Decimal("0")
    components: list[ComponentInput] = []
    for component in config.components:
        value_input = inputs.get(component.code)
        if value_input is None or not value_input.available or value_input.value is None:
            components.append(
                value_input
                or ComponentInput(
                    code=component.code,
                    value=None,
                    available=False,
                    unavailable_reason="not_computed",
                )
            )
            continue
        components.append(value_input)
        available_weight += component.weight
        weighted_sum += value_input.value * component.weight

    completeness = (available_weight / total_weight) if total_weight else Decimal("0")
    if available_weight > 0:
        score = (weighted_sum / available_weight * Decimal("100")).quantize(Decimal("0.01"))
    else:
        score = Decimal("0")
    score = min(max(score, Decimal("0")), Decimal("100"))
    band = config.band_for_score(score)
    return ConfidenceOutcome(
        score=score,
        band=band,
        completeness=completeness.quantize(Decimal("0.0001")),
        components=tuple(components),
    )
