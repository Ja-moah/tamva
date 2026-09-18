from __future__ import annotations

import hashlib
import json
from decimal import Decimal
from typing import Any

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.feature.models import FeatureComputationRun
from domains.modeling.models import ModelDefinition, ModelEvaluationResult, ModelEvaluationRun
from domains.partner.models import Institution
from domains.rules.models import RuleEvaluationRun

from .models import RiskEvaluationRun, RiskEvent, RiskPolicy, RiskPolicyVersion, RiskReason
from .policy import DEFAULT_CONFIGURATION, RiskEvidence, RiskPolicyConfig, apply_policy


def create_reference_policy_version(*, version: str = "1") -> RiskPolicyVersion:
    policy, _ = RiskPolicy.objects.get_or_create(
        code="reference_policy",
        defaults={"name": "Reference risk policy"},
    )
    policy_version, _ = RiskPolicyVersion.objects.get_or_create(
        policy=policy,
        version=version,
        defaults={
            "configuration": DEFAULT_CONFIGURATION,
            "status": RiskPolicyVersion.Status.ACTIVE,
        },
    )
    return policy_version


def _normalize_model_score(result: ModelEvaluationResult) -> Decimal:
    definition = result.model_version.model_definition
    span = definition.score_max - definition.score_min
    ratio = (result.score - definition.score_min) / span if span else Decimal("0")
    if definition.score_direction == ModelDefinition.ScoreDirection.HIGHER_IS_SAFER:
        ratio = Decimal("1") - ratio
    ratio = min(max(ratio, Decimal("0")), Decimal("1"))
    return (ratio * Decimal("1000")).quantize(Decimal("0.0001"))


def _fingerprint(
    *,
    feature_run: FeatureComputationRun,
    policy_version: RiskPolicyVersion,
    rule_run: RuleEvaluationRun | None,
    model_run: ModelEvaluationRun | None,
) -> str:
    payload = {
        "feature_run_id": str(feature_run.id),
        "feature_source": feature_run.source_fingerprint,
        "policy": f"{policy_version.policy.code}:{policy_version.version}",
        "rule_run_id": str(rule_run.id) if rule_run else None,
        "rule_run_fingerprint": rule_run.source_fingerprint if rule_run else None,
        "model_run_id": str(model_run.id) if model_run else None,
        "model_run_fingerprint": model_run.source_fingerprint if model_run else None,
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


@transaction.atomic
def evaluate_risk(
    *,
    feature_run: FeatureComputationRun,
    policy_version: RiskPolicyVersion,
    institution: Institution,
    rule_run: RuleEvaluationRun | None = None,
    model_run: ModelEvaluationRun | None = None,
) -> RiskEvaluationRun:
    if feature_run.institution_id != institution.id:
        raise PermissionDenied("Feature run does not belong to the active institution.")
    if rule_run is not None and (
        rule_run.institution_id != institution.id or rule_run.feature_run_id != feature_run.id
    ):
        raise PermissionDenied("Rule evaluation does not belong to the active institution.")
    if model_run is not None and (
        model_run.institution_id != institution.id or model_run.feature_run_id != feature_run.id
    ):
        raise PermissionDenied("Model evaluation does not belong to the active institution.")
    if not policy_version.policy.active:
        raise ValidationError("Risk policy is not active.")
    if policy_version.status == RiskPolicyVersion.Status.RETIRED:
        raise ValidationError("Retired risk policy versions cannot start new evaluations.")

    fingerprint = _fingerprint(
        feature_run=feature_run,
        policy_version=policy_version,
        rule_run=rule_run,
        model_run=model_run,
    )
    existing = RiskEvaluationRun.objects.filter(
        feature_run=feature_run,
        policy_version=policy_version,
        rule_run=rule_run,
        model_run=model_run,
        source_fingerprint=fingerprint,
    ).first()
    if existing:
        return existing

    run = RiskEvaluationRun.objects.create(
        institution=institution,
        customer=feature_run.customer,
        feature_run=feature_run,
        rule_run=rule_run,
        model_run=model_run,
        policy_version=policy_version,
        source_fingerprint=fingerprint,
        status=RiskEvaluationRun.Status.RUNNING,
    )

    try:
        config = RiskPolicyConfig.from_dict(policy_version.configuration)

        rule_results: tuple[Any, ...] | None = None
        if rule_run is not None:
            rule_results = tuple(rule_run.results.all())

        model_score: Decimal | None = None
        model_confidence: Decimal | None = None
        if model_run is not None and model_run.status in (
            ModelEvaluationRun.Status.SUCCEEDED,
            ModelEvaluationRun.Status.SKIPPED,
        ):
            result = getattr(model_run, "result", None)
            if result is not None:
                model_score = _normalize_model_score(result)
                model_confidence = result.confidence

        completeness_value = (
            feature_run.values.filter(definition__code="profile_completeness", available=True)
            .values_list("numeric_value", flat=True)
            .first()
        )

        outcome = apply_policy(
            config,
            RiskEvidence(
                rule_results=rule_results,
                model_score=model_score,
                model_confidence=model_confidence,
                profile_completeness=completeness_value,
            ),
        )
    except Exception as exc:
        run.status = RiskEvaluationRun.Status.FAILED
        run.failure_reason = type(exc).__name__
        run.save(update_fields=["status", "failure_reason", "updated_at"])
        AuditEvent.objects.create(
            institution=institution,
            action="RISK_EVALUATED",
            outcome=AuditEvent.Outcome.FAILURE,
            metadata={"risk_run_id": str(run.id), "reason": run.failure_reason},
        )
        return run

    event = RiskEvent.objects.create(
        run=run,
        institution=institution,
        customer=feature_run.customer,
        feature_run=feature_run,
        rule_run=rule_run,
        model_run=model_run,
        policy_version=policy_version,
        ruleset_version=rule_run.rule_set_version if rule_run else None,
        model_version=model_run.model_version if model_run else None,
        score=outcome.score,
        decision=outcome.decision,
        confidence=outcome.confidence,
        evaluated_at=timezone.now(),
    )
    RiskReason.objects.bulk_create(
        RiskReason(event=event, ordinal=ordinal, **reason)
        for ordinal, reason in enumerate(outcome.reasons)
    )
    run.status = (
        RiskEvaluationRun.Status.SKIPPED
        if policy_version.status == RiskPolicyVersion.Status.DRAFT
        else RiskEvaluationRun.Status.COMPLETED
    )
    run.save(update_fields=["status", "updated_at"])
    AuditEvent.objects.create(
        institution=institution,
        action="RISK_EVALUATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "risk_event_id": str(event.id),
            "decision": outcome.decision,
            "status": run.status,
        },
    )
    return run
