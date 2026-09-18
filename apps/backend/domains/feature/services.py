from __future__ import annotations

import hashlib
import json
import statistics
from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction

from domains.audit.models import AuditEvent
from domains.counterparty.services import sync_customer_counterparties
from domains.normalisation.models import CanonicalTransaction
from domains.profile.models import FinancialProfileSnapshot
from domains.security.models import CustomerDevice, LocationObservation

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


# ---------------------------------------------------------------------------
# Velocity / behavioural / device / location / counterparty signals.
#
# These share the same FeatureComputationRun/FeatureValue/FeatureSetVersion
# models and idempotency contract as compute_features() above, but live in
# their own feature set ("intelligence_signals") rather than being folded
# into DEFAULT_FEATURES/"core_behavioural", so every existing caller of
# create_default_feature_set()/compute_features() is completely unaffected.
#
# All windows are measured back from the profile snapshot's period_end
# (not wall-clock "now"), so results are deterministic and reproducible.
# ---------------------------------------------------------------------------

INTELLIGENCE_FEATURES: tuple[dict[str, str], ...] = (
    {
        "code": "transactions_last_1h",
        "name": "Transactions in the last hour",
        "description": "Count of canonical transactions in the 1h before the profile period end.",
        "value_type": "DECIMAL",
        "unit": "count",
    },
    {
        "code": "transaction_value_last_1h",
        "name": "Transaction value in the last hour",
        "description": "Sum of transaction amounts in the 1h before the profile period end.",
        "value_type": "DECIMAL",
        "unit": "currency",
    },
    {
        "code": "transactions_last_24h",
        "name": "Transactions in the last 24 hours",
        "description": "Count of canonical transactions in the 24h before the profile period end.",
        "value_type": "DECIMAL",
        "unit": "count",
    },
    {
        "code": "unique_counterparties_30d",
        "name": "Unique counterparties in the last 30 days",
        "description": "Distinct counterparties transacted with in the 30d before period end.",
        "value_type": "DECIMAL",
        "unit": "count",
    },
    {
        "code": "typical_transaction_amount",
        "name": "Typical transaction amount",
        "description": "Median transaction amount observed within the profile period.",
        "value_type": "DECIMAL",
        "unit": "currency",
    },
    {
        "code": "transaction_amount_deviation",
        "name": "Transaction amount deviation",
        "description": "Most recent transaction amount divided by the typical transaction amount.",
        "value_type": "DECIMAL",
        "unit": "ratio",
    },
    {
        "code": "typical_daily_frequency",
        "name": "Typical daily transaction frequency",
        "description": "Average transactions per day observed within the profile period.",
        "value_type": "DECIMAL",
        "unit": "per_day",
    },
    {
        "code": "frequency_deviation",
        "name": "Transaction frequency deviation",
        "description": "Transactions in the last 24h divided by the typical daily frequency.",
        "value_type": "DECIMAL",
        "unit": "ratio",
    },
    {
        "code": "new_counterparty_flag",
        "name": "New counterparty flag",
        "description": "Whether the latest transaction's counterparty was first seen then.",
        "value_type": "BOOLEAN",
        "unit": "",
    },
    {
        "code": "new_device_flag",
        "name": "New device flag",
        "description": "Whether a device was first linked to this customer within the last 24h.",
        "value_type": "BOOLEAN",
        "unit": "",
    },
    {
        "code": "new_location_flag",
        "name": "New location flag",
        "description": "Whether the latest location is a new country within the last 24h.",
        "value_type": "BOOLEAN",
        "unit": "",
    },
)


def create_intelligence_feature_set(*, version: str = "1") -> FeatureSetVersion:
    feature_set, _ = FeatureSetVersion.objects.get_or_create(
        code="intelligence_signals", version=version
    )
    for ordinal, definition_data in enumerate(INTELLIGENCE_FEATURES):
        definition, _ = FeatureDefinition.objects.get_or_create(
            code=definition_data["code"],
            defaults={**definition_data, "version": version},
        )
        FeatureSetVersion.definitions.through.objects.get_or_create(
            feature_set=feature_set, definition=definition, defaults={"ordinal": ordinal}
        )
    return feature_set


def _available_bool(
    definition: FeatureDefinition, value: bool, snapshot: FinancialProfileSnapshot, source: str
) -> dict[str, Any]:
    return {
        "definition": definition,
        "boolean_value": value,
        "confidence": Decimal("1"),
        "available": True,
        "provenance": {"profile_snapshot_id": str(snapshot.id), "source": source},
    }


@transaction.atomic
def compute_intelligence_features(
    *, snapshot: FinancialProfileSnapshot, feature_set: FeatureSetVersion
) -> FeatureComputationRun:
    profile = snapshot.profile
    if profile.current_snapshot_id != snapshot.id and not snapshot.is_current:
        raise ValidationError("Feature computation requires a current profile snapshot.")

    institution = profile.institution
    customer = profile.customer
    as_of = snapshot.period_end
    window_1h_start = as_of - timedelta(hours=1)
    window_24h_start = as_of - timedelta(hours=24)
    window_30d_start = as_of - timedelta(days=30)

    period_transactions = list(
        CanonicalTransaction.objects.filter(
            institution=institution,
            customer=customer,
            occurred_at__gte=snapshot.period_start,
            occurred_at__lte=as_of,
        ).order_by("occurred_at")
    )
    relationships = sync_customer_counterparties(institution=institution, customer=customer)

    fingerprint_payload = {
        "profile_snapshot_id": str(snapshot.id),
        "profile_source_fingerprint": snapshot.source_fingerprint,
        "feature_set": f"{feature_set.code}:{feature_set.version}",
        "transaction_ids": sorted(str(txn.id) for txn in period_transactions),
        "relationship_state": sorted(
            f"{rel.id}:{rel.transaction_count}:{rel.last_seen_at.isoformat()}"
            for rel in relationships
        ),
        "device_state": sorted(
            f"{link.id}:{link.first_seen_at.isoformat()}"
            for link in CustomerDevice.objects.filter(institution=institution, customer=customer)
        ),
        "location_state": sorted(
            f"{loc.id}:{loc.observed_at.isoformat()}:{loc.country_code}"
            for loc in LocationObservation.objects.filter(
                institution=institution, customer=customer
            )
        ),
    }
    fingerprint = hashlib.sha256(
        json.dumps(fingerprint_payload, sort_keys=True, default=str).encode()
    ).hexdigest()

    existing = FeatureComputationRun.objects.filter(
        profile_snapshot=snapshot, feature_set_version=feature_set, source_fingerprint=fingerprint
    ).first()
    if existing:
        existing.status = FeatureComputationRun.Status.REUSED
        existing.save(update_fields=["status", "updated_at"])
        return existing

    run = FeatureComputationRun.objects.create(
        institution=institution,
        customer=customer,
        profile_snapshot=snapshot,
        feature_set_version=feature_set,
        source_fingerprint=fingerprint,
    )
    definitions = {definition.code: definition for definition in feature_set.definitions.all()}
    values: list[dict[str, Any]] = []

    txns_1h = [txn for txn in period_transactions if txn.occurred_at >= window_1h_start]
    txns_24h = [txn for txn in period_transactions if txn.occurred_at >= window_24h_start]
    values.append(
        _available_decimal(
            definitions["transactions_last_1h"],
            Decimal(len(txns_1h)),
            Decimal("1"),
            snapshot,
            "ledger",
        )
    )
    values.append(
        _available_decimal(
            definitions["transaction_value_last_1h"],
            sum((txn.amount for txn in txns_1h), Decimal("0")),
            Decimal("1"),
            snapshot,
            "ledger",
        )
    )
    values.append(
        _available_decimal(
            definitions["transactions_last_24h"],
            Decimal(len(txns_24h)),
            Decimal("1"),
            snapshot,
            "ledger",
        )
    )

    unique_counterparties_30d = {
        rel.counterparty_id for rel in relationships if rel.last_seen_at >= window_30d_start
    }
    values.append(
        _available_decimal(
            definitions["unique_counterparties_30d"],
            Decimal(len(unique_counterparties_30d)),
            Decimal("1"),
            snapshot,
            "counterparty",
        )
    )

    if period_transactions:
        typical_amount = Decimal(
            statistics.median(txn.amount for txn in period_transactions)
        ).quantize(Decimal("0.000001"))
        values.append(
            _available_decimal(
                definitions["typical_transaction_amount"],
                typical_amount,
                Decimal("1"),
                snapshot,
                "ledger",
            )
        )
        latest_amount = period_transactions[-1].amount
        if typical_amount > 0:
            deviation = (latest_amount / typical_amount).quantize(Decimal("0.000001"))
            values.append(
                _available_decimal(
                    definitions["transaction_amount_deviation"],
                    deviation,
                    Decimal("1"),
                    snapshot,
                    "ledger",
                )
            )
        else:
            values.append(
                _unavailable(
                    definitions["transaction_amount_deviation"],
                    "no_baseline_amount",
                    Decimal("0"),
                    snapshot,
                )
            )

        period_days = max((snapshot.period_end - snapshot.period_start).days, 1)
        typical_frequency = (Decimal(len(period_transactions)) / Decimal(period_days)).quantize(
            Decimal("0.000001")
        )
        values.append(
            _available_decimal(
                definitions["typical_daily_frequency"],
                typical_frequency,
                Decimal("1"),
                snapshot,
                "ledger",
            )
        )
        if typical_frequency > 0:
            frequency_deviation = (Decimal(len(txns_24h)) / typical_frequency).quantize(
                Decimal("0.000001")
            )
            values.append(
                _available_decimal(
                    definitions["frequency_deviation"],
                    frequency_deviation,
                    Decimal("1"),
                    snapshot,
                    "ledger",
                )
            )
        else:
            values.append(
                _unavailable(
                    definitions["frequency_deviation"],
                    "no_baseline_activity",
                    Decimal("0"),
                    snapshot,
                )
            )

        latest_txn = period_transactions[-1]
        latest_relationship = next(
            (
                rel
                for rel in relationships
                if rel.counterparty.counterparty_reference == latest_txn.counterparty_reference
            ),
            None,
        )
        is_new_counterparty = bool(
            latest_relationship is not None
            and latest_relationship.first_seen_at == latest_txn.occurred_at
        )
        values.append(
            _available_bool(
                definitions["new_counterparty_flag"], is_new_counterparty, snapshot, "counterparty"
            )
        )
    else:
        for code, reason in (
            ("typical_transaction_amount", "insufficient_history"),
            ("transaction_amount_deviation", "insufficient_history"),
            ("typical_daily_frequency", "insufficient_history"),
            ("frequency_deviation", "insufficient_history"),
            ("new_counterparty_flag", "insufficient_history"),
        ):
            values.append(_unavailable(definitions[code], reason, Decimal("0"), snapshot))

    device_links = list(
        CustomerDevice.objects.filter(institution=institution, customer=customer).order_by(
            "first_seen_at"
        )
    )
    if device_links:
        newest_device = max(device_links, key=lambda link: link.first_seen_at)
        is_new_device = newest_device.first_seen_at >= window_24h_start
        values.append(
            _available_bool(definitions["new_device_flag"], is_new_device, snapshot, "security")
        )
    else:
        values.append(
            _unavailable(
                definitions["new_device_flag"], "no_device_observations", Decimal("0"), snapshot
            )
        )

    locations = list(
        LocationObservation.objects.filter(
            institution=institution, customer=customer, observed_at__lte=as_of
        ).order_by("observed_at")
    )
    if len(locations) >= 2:
        latest_location, previous_location = locations[-1], locations[-2]
        is_new_location = (
            latest_location.observed_at >= window_24h_start
            and latest_location.country_code != previous_location.country_code
        )
        values.append(
            _available_bool(definitions["new_location_flag"], is_new_location, snapshot, "security")
        )
    else:
        values.append(
            _unavailable(
                definitions["new_location_flag"], "insufficient_history", Decimal("0"), snapshot
            )
        )

    FeatureValue.objects.bulk_create([FeatureValue(run=run, **value) for value in values])
    run.status = FeatureComputationRun.Status.COMPLETED
    run.metadata = {"feature_count": len(values), "profile_snapshot_id": str(snapshot.id)}
    run.save(update_fields=["status", "metadata", "updated_at"])
    AuditEvent.objects.create(
        institution=institution,
        action="INTELLIGENCE_FEATURES_COMPUTED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "feature_run_id": str(run.id),
            "feature_set": f"{feature_set.code}:{feature_set.version}",
            "profile_snapshot_id": str(snapshot.id),
        },
    )
    return run
