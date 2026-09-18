from __future__ import annotations

import hashlib
import json
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.feature.models import FeatureComputationRun
from domains.identity.models import User
from domains.partner.models import Institution
from domains.profile.models import FinancialProfile, FinancialProfileSnapshot

from .models import (
    FinancialConfidenceComponent,
    FinancialConfidencePolicy,
    FinancialConfidencePolicyVersion,
    FinancialConfidenceSnapshot,
)
from .policy import (
    DEFAULT_CONFIGURATION,
    ComponentInput,
    FinancialConfidenceConfig,
    apply_confidence_policy,
)


def create_reference_confidence_policy_version(
    *, version: str = "1"
) -> FinancialConfidencePolicyVersion:
    policy, _ = FinancialConfidencePolicy.objects.get_or_create(
        code="reference_confidence_policy",
        defaults={"name": "Reference financial confidence policy"},
    )
    policy_version, _ = FinancialConfidencePolicyVersion.objects.get_or_create(
        policy=policy,
        version=version,
        defaults={
            "configuration": DEFAULT_CONFIGURATION,
            "status": FinancialConfidencePolicyVersion.Status.ACTIVE,
        },
    )
    return policy_version


def _clip_unit(value: Decimal) -> Decimal:
    return min(max(value, Decimal("0")), Decimal("1"))


def _resolve_component_inputs(
    *, profile_snapshot: FinancialProfileSnapshot, feature_run: FeatureComputationRun | None
) -> dict[str, ComponentInput]:
    inputs: dict[str, ComponentInput] = {}

    inputs["profile_completeness"] = ComponentInput(
        code="profile_completeness",
        value=Decimal("1")
        if profile_snapshot.completeness.get("has_ledger_entries")
        else Decimal("0"),
        available=True,
    )
    inputs["account_coverage"] = ComponentInput(
        code="account_coverage", value=_clip_unit(profile_snapshot.coverage_ratio), available=True
    )

    feature_values = {}
    if feature_run is not None:
        feature_values = {
            value.definition.code: value
            for value in feature_run.values.select_related("definition")
        }

    for code in ("cashflow_consistency", "savings_behaviour"):
        source_code = "savings_rate" if code == "savings_behaviour" else code
        feature_value = feature_values.get(source_code)
        if feature_run is None:
            inputs[code] = ComponentInput(
                code=code, value=None, available=False, unavailable_reason="no_feature_run"
            )
        elif (
            feature_value is None
            or not feature_value.available
            or feature_value.numeric_value is None
        ):
            inputs[code] = ComponentInput(
                code=code, value=None, available=False, unavailable_reason="insufficient_history"
            )
        else:
            inputs[code] = ComponentInput(
                code=code, value=_clip_unit(feature_value.numeric_value), available=True
            )

    cash_flow = getattr(profile_snapshot, "cash_flow", None)
    if cash_flow is None:
        inputs["transaction_history_depth"] = ComponentInput(
            code="transaction_history_depth",
            value=None,
            available=False,
            unavailable_reason="no_cash_flow_summary",
        )
    else:
        # Reference window: 30 observed transactions in the profile period is
        # treated as "full" depth. This is a development threshold, not a
        # universal financial truth; it belongs to the policy, not the code,
        # if it ever needs to vary.
        depth = _clip_unit(Decimal(cash_flow.transaction_count) / Decimal("30"))
        inputs["transaction_history_depth"] = ComponentInput(
            code="transaction_history_depth", value=depth, available=True
        )

    return inputs


def _fingerprint(
    *,
    profile_snapshot: FinancialProfileSnapshot,
    feature_run: FeatureComputationRun | None,
    policy_version: FinancialConfidencePolicyVersion,
) -> str:
    payload = {
        "profile_snapshot_id": str(profile_snapshot.id),
        "profile_source_fingerprint": profile_snapshot.source_fingerprint,
        "feature_run_id": str(feature_run.id) if feature_run else None,
        "policy_version_id": str(policy_version.id),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


@transaction.atomic
def compute_financial_confidence(
    *, institution: Institution, customer: User, policy_version: FinancialConfidencePolicyVersion
) -> FinancialConfidenceSnapshot:
    try:
        profile = FinancialProfile.objects.get(institution=institution, customer=customer)
    except FinancialProfile.DoesNotExist as exc:
        raise ValidationError(
            "Customer has no financial profile at the active institution."
        ) from exc
    profile_snapshot = profile.current_snapshot
    if profile_snapshot is None:
        raise ValidationError("Financial profile has no current snapshot yet.")
    if policy_version.status == FinancialConfidencePolicyVersion.Status.RETIRED:
        raise ValidationError("Retired confidence policy versions cannot start new evaluations.")

    feature_run = (
        FeatureComputationRun.objects.filter(
            profile_snapshot=profile_snapshot,
            status__in=[
                FeatureComputationRun.Status.COMPLETED,
                FeatureComputationRun.Status.REUSED,
            ],
        )
        .order_by("-created_at")
        .first()
    )

    fingerprint = _fingerprint(
        profile_snapshot=profile_snapshot, feature_run=feature_run, policy_version=policy_version
    )
    existing = FinancialConfidenceSnapshot.objects.filter(
        institution=institution,
        customer=customer,
        policy_version=policy_version,
        source_fingerprint=fingerprint,
    ).first()
    if existing:
        return existing

    config = FinancialConfidenceConfig.from_dict(policy_version.configuration)
    inputs = _resolve_component_inputs(profile_snapshot=profile_snapshot, feature_run=feature_run)
    outcome = apply_confidence_policy(config, inputs)

    FinancialConfidenceSnapshot.objects.filter(
        institution=institution, customer=customer, is_current=True
    ).update(is_current=False)

    snapshot = FinancialConfidenceSnapshot.objects.create(
        institution=institution,
        customer=customer,
        policy_version=policy_version,
        source_fingerprint=fingerprint,
        score=outcome.score,
        band=outcome.band,
        completeness=outcome.completeness,
        evaluated_at=timezone.now(),
        provenance={
            "profile_snapshot_id": str(profile_snapshot.id),
            "feature_run_id": str(feature_run.id) if feature_run else None,
        },
        is_current=True,
    )
    FinancialConfidenceComponent.objects.bulk_create(
        FinancialConfidenceComponent(
            snapshot=snapshot,
            code=component.code,
            weight=next(c.weight for c in config.components if c.code == component.code),
            value=component.value,
            available=component.available,
            unavailable_reason=component.unavailable_reason,
        )
        for component in outcome.components
    )

    AuditEvent.objects.create(
        institution=institution,
        action="FINANCIAL_CONFIDENCE_COMPUTED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "confidence_snapshot_id": str(snapshot.id),
            "customer_id": str(customer.id),
            "band": outcome.band,
        },
    )
    return snapshot
