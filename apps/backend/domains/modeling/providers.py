from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Protocol

from django.core.exceptions import ValidationError

from .models import ModelVersion


@dataclass(frozen=True)
class ModelProviderOutput:
    """Generic model output. Kept intentionally provider-agnostic."""

    score: Decimal
    confidence: Decimal | None
    output_code: str | None
    contributions: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


class ModelProvider(Protocol):
    """Execution boundary between the domain and any inference implementation.

    Business code must depend on this interface, never on a specific ML
    framework, model file, or vendor API.
    """

    code: str

    def evaluate(
        self, *, model_version: ModelVersion, inputs: dict[str, Any]
    ) -> ModelProviderOutput: ...


class DeterministicMockModelProvider:
    """Development/reference provider.

    Produces a reproducible score derived from a hash of the model version
    and its validated inputs. This is NOT a trained credit/fraud/risk model
    and must never be presented or relied upon as one.
    """

    code = "deterministic_reference_v1"

    def evaluate(
        self, *, model_version: ModelVersion, inputs: dict[str, Any]
    ) -> ModelProviderOutput:
        definition = model_version.model_definition
        payload = {
            "model_version": f"{definition.code}:{model_version.version}",
            "inputs": {key: str(value) for key, value in inputs.items()},
        }
        digest = hashlib.sha256(
            json.dumps(payload, sort_keys=True, default=str).encode()
        ).hexdigest()
        span = definition.score_max - definition.score_min
        ratio = Decimal(int(digest[:16], 16)) / Decimal(16**16 - 1)
        score = (definition.score_min + ratio * span).quantize(Decimal("0.0001"))
        contributions = [
            {
                "feature_code": key,
                "value": str(value),
                "weight": round(1 / len(inputs), 4) if inputs else 0,
            }
            for key, value in sorted(inputs.items())
        ]
        return ModelProviderOutput(
            score=score,
            confidence=Decimal("0.5"),
            output_code="REFERENCE_EVALUATION",
            contributions=contributions,
            metadata={
                "provider": self.code,
                "reference_only": True,
                "note": (
                    "Deterministic development/reference provider; not a trained production model."
                ),
            },
        )


_PROVIDERS: dict[str, ModelProvider] = {}


def register_provider(provider: ModelProvider) -> None:
    _PROVIDERS[provider.code] = provider


def get_provider(code: str) -> ModelProvider:
    try:
        return _PROVIDERS[code]
    except KeyError as exc:
        raise ValidationError(f"Unknown model provider: {code}") from exc


register_provider(DeterministicMockModelProvider())
