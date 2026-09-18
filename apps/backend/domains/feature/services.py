from __future__ import annotations

import hashlib
import json
from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction

from domains.audit.models import AuditEvent
from domains.profile.models import FinancialProfileSnapshot

from .models import FeatureComputationRun, FeatureDefinition, FeatureSetVersion, FeatureValue

DEFAULT_FEATURES: tuple[dict[str, str], ...] = (
    {
        "code": "account_coverage",
        "name": "Account coverage",
        "description": "Share of known accounts with trusted ledger activity.",
        "value_type": "DECIMAL",
        "unit": "ratio",
    },
    {
        "code": "profile_completeness",
        "name": "Profile completeness",
        "description": "Whether the profile has trusted history and account coverage.",
        "value_type": "DECIMAL",
        "unit": "ratio",
    },
    {
        "code": "savings_rate",
        "name": "Savings rate",
        "description": "Net savings divided by observed inflows.",
        "value_type": "DECIMAL",
        "unit": "ratio",
    },
    {
        "code": "transaction_frequency",
        "name": "Transaction frequency",
        "description": "Observed ledger transactions per month in the profile window.",
        "value_type": "DECIMAL",
        "unit": "per_month",
    },
    {
        "code": "cashflow_consistency",
        "name": "Cashflow consistency",
        "description": "Time-series cashflow consistency; unavailable without dated series facts.",
        "value_type": "DECIMAL",
        "unit": "ratio",
    },
)


def create_default_feature_set(*, version: str = "1") -> FeatureSetVersion:
    feature_set, _ = FeatureSetVersion.objects.get_or_create(
        code="core_behavioural", version=version
    )
    for ordinal, definition_data in enumerate(DEFAULT_FEATURES):
        definition, _ = FeatureDefinition.objects.get_or_create(
            code=definition_data["code"],
            defaults={**definition_data, "version": version},
        )
        FeatureSetVersion.definitions.through.objects.get_or_create(
            feature_set=feature_set, definition=definition, defaults={"ordinal": ordinal}
        )
    return feature_set


def _fingerprint(snapshot: FinancialProfileSnapshot, feature_set: FeatureSetVersion) -> str:
    payload = {
        "snapshot_id": str(snapshot.id),
        "snapshot_fingerprint": snapshot.source_fingerprint,
        "feature_set": f"{feature_set.code}:{feature_set.version}",
        "definitions": list(
            feature_set.definitions.order_by("code").values_list("code", "version")
        ),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _available_decimal(
    definition: FeatureDefinition,
    value: Decimal,
    confidence: Decimal,
    snapshot: FinancialProfileSnapshot,
    source: str,
) -> dict[str, Any]:
    return {
        "definition": definition,
        "numeric_value": value,
        "confidence": confidence,
        "available": True,
        "provenance": {"profile_snapshot_id": str(snapshot.id), "source": source},
    }


def _unavailable(
    definition: FeatureDefinition,
    reason: str,
    confidence: Decimal,
    snapshot: FinancialProfileSnapshot,
) -> dict[str, Any]:
    return {
        "definition": definition,
        "confidence": confidence,
        "available": False,
        "unavailable_reason": reason,
        "provenance": {"profile_snapshot_id": str(snapshot.id)},
    }


@transaction.atomic
def compute_features(
    *, snapshot: FinancialProfileSnapshot, feature_set: FeatureSetVersion
) -> FeatureComputationRun:
    profile = snapshot.profile
    if profile.current_snapshot_id != snapshot.id and not snapshot.is_current:
        raise ValidationError("Feature computation requires a current profile snapshot.")
    fingerprint = _fingerprint(snapshot, feature_set)
    existing = FeatureComputationRun.objects.filter(
        profile_snapshot=snapshot, feature_set_version=feature_set, source_fingerprint=fingerprint
    ).first()
    if existing:
        existing.status = FeatureComputationRun.Status.REUSED
        existing.save(update_fields=["status", "updated_at"])
        return existing

    run = FeatureComputationRun.objects.create(
        institution=profile.institution,
        customer=profile.customer,
        profile_snapshot=snapshot,
        feature_set_version=feature_set,
        source_fingerprint=fingerprint,
    )
    confidence = Decimal("1") if snapshot.confidence == "HIGH" else Decimal("0.5")
    cash_flow = snapshot.cash_flow
    savings = snapshot.savings
    definitions = {definition.code: definition for definition in feature_set.definitions.all()}
    values: list[dict[str, Any]] = []
    values.append(
        _available_decimal(
            definitions["account_coverage"],
            snapshot.coverage_ratio,
            confidence,
            snapshot,
            "profile",
        )
    )
    completeness = Decimal("1") if snapshot.completeness.get("has_ledger_entries") else Decimal("0")
    values.append(
        _available_decimal(
            definitions["profile_completeness"], completeness, confidence, snapshot, "profile"
        )
    )
    if cash_flow.total_inflows:
        values.append(
            _available_decimal(
                definitions["savings_rate"], savings.savings_rate, confidence, snapshot, "savings"
            )
        )
    else:
        values.append(
            _unavailable(
                definitions["savings_rate"], "insufficient_history", Decimal("0"), snapshot
            )
        )
    if cash_flow.transaction_count:
        days = max((snapshot.period_end - snapshot.period_start).days, 1)
        frequency = (Decimal(cash_flow.transaction_count) * Decimal("30") / Decimal(days)).quantize(
            Decimal("0.000001")
        )
        values.append(
            _available_decimal(
                definitions["transaction_frequency"], frequency, confidence, snapshot, "cash_flow"
            )
        )
    else:
        values.append(
            _unavailable(
                definitions["transaction_frequency"], "insufficient_history", Decimal("0"), snapshot
            )
        )
    values.append(
        _unavailable(
            definitions["cashflow_consistency"], "unsupported_source_data", Decimal("0"), snapshot
        )
    )
    FeatureValue.objects.bulk_create([FeatureValue(run=run, **value) for value in values])
    run.status = FeatureComputationRun.Status.COMPLETED
    run.metadata = {"feature_count": len(values), "profile_snapshot_id": str(snapshot.id)}
    run.save(update_fields=["status", "metadata", "updated_at"])
    AuditEvent.objects.create(
        institution=profile.institution,
        action="FEATURES_COMPUTED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "feature_run_id": str(run.id),
            "feature_set": f"{feature_set.code}:{feature_set.version}",
            "profile_snapshot_id": str(snapshot.id),
        },
    )
    return run
