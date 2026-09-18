from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.core.exceptions import ValidationError


@dataclass(frozen=True)
class CaseOpeningConfig:
    """Structured, validated case-opening configuration. Data only: no eval()."""

    trigger_decisions: tuple[str, ...]
    trigger_reason_codes: tuple[str, ...]
    default_type: str
    default_priority: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> CaseOpeningConfig:
        if not isinstance(data, dict):
            raise ValidationError("Case opening configuration must be an object.")
        try:
            trigger_decisions = tuple(data["trigger_decisions"])
            trigger_reason_codes = tuple(data["trigger_reason_codes"])
            default_type = data["default_type"]
            default_priority = data["default_priority"]
        except KeyError as exc:
            raise ValidationError(
                f"Case opening configuration is missing required key: {exc}"
            ) from exc
        if not isinstance(default_type, str) or not default_type:
            raise ValidationError("default_type must be a non-empty string.")
        if not isinstance(default_priority, str) or not default_priority:
            raise ValidationError("default_priority must be a non-empty string.")
        return cls(
            trigger_decisions=trigger_decisions,
            trigger_reason_codes=trigger_reason_codes,
            default_type=default_type,
            default_priority=default_priority,
        )

    def should_open_case(self, *, decision: str, reason_codes: list[str]) -> bool:
        if decision in self.trigger_decisions:
            return True
        return any(code in self.trigger_reason_codes for code in reason_codes)


# Reference/development configuration only.
DEFAULT_CONFIGURATION: dict[str, Any] = {
    "trigger_decisions": ["BLOCK", "HOLD"],
    "trigger_reason_codes": [],
    "default_type": "RISK_REVIEW",
    "default_priority": "HIGH",
}
