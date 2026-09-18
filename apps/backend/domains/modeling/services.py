from __future__ import annotations

import hashlib
import json
from typing import Any

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.feature.models import FeatureComputationRun
from domains.partner.models import Institution

from .models import (
    ModelDefinition,
    ModelEvaluationResult,
    ModelEvaluationRun,
    ModelFeatureBinding,
    ModelVersion,
)
from .providers import get_provider


def _fingerprint(feature_run: FeatureComputationRun, model_version: ModelVersion) -> str:
    payload = {
        "feature_run_id": str(feature_run.id),
        "feature_source": feature_run.source_fingerprint,
        "model_version": f"{model_version.model_definition.code}:{model_version.version}",
        "bindings": list(
            model_version.feature_bindings.order_by("feature__code").values_list(
                "feature__code", "required", "expected_type", "on_missing"
            )
        ),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _resolve_inputs(
    *, feature_run: FeatureComputationRun, model_version: ModelVersion
) -> tuple[dict[str, Any], str | None]:
    feature_values = {
        value.definition.code: value for value in feature_run.values.select_related("definition")
    }
    inputs: dict[str, Any] = {}
    for binding in model_version.feature_bindings.select_related("feature").all():
        code = binding.feature.code
        value = feature_values.get(code)
        if value is None or not value.available:
            if binding.required:
                return {}, f"MISSING_REQUIRED_FEATURE:{code}"
            if binding.on_missing == ModelFeatureBinding.OnMissing.FAIL:
                return {}, f"MISSING_OPTIONAL_FEATURE:{code}"
            if binding.on_missing == ModelFeatureBinding.OnMissing.DEFAULT:
                inputs[code] = binding.default_value
            continue
        if value.numeric_value is not None:
            inputs[code] = value.numeric_value
        elif value.boolean_value is not None:
            inputs[code] = value.boolean_value
        else:
            inputs[code] = value.categorical_value
    return inputs, None


@transaction.atomic
def evaluate_model(
    *,
    feature_run: FeatureComputationRun,
    model_version: ModelVersion,
    institution: Institution,
) -> ModelEvaluationRun:
    if feature_run.institution_id != institution.id:
        raise PermissionDenied("Feature run does not belong to the active institution.")
    definition = model_version.model_definition
    if (
        definition.owner_scope == ModelDefinition.OwnerScope.INSTITUTION
        and definition.institution_id != institution.id
    ):
        raise PermissionDenied("Model is not available to the active institution.")
    if model_version.status == ModelVersion.Status.RETIRED:
        raise ValidationError("Retired model versions cannot start new evaluations.")
    if feature_run.status not in (
        FeatureComputationRun.Status.COMPLETED,
        FeatureComputationRun.Status.REUSED,
    ):
        raise ValidationError("Model evaluation requires a completed feature computation.")

    fingerprint = _fingerprint(feature_run, model_version)
    existing = ModelEvaluationRun.objects.filter(
        feature_run=feature_run, model_version=model_version, source_fingerprint=fingerprint
    ).first()
    if existing:
        return existing

    run = ModelEvaluationRun.objects.create(
        institution=institution,
        customer=feature_run.customer,
        feature_run=feature_run,
        model_version=model_version,
        source_fingerprint=fingerprint,
        status=ModelEvaluationRun.Status.RUNNING,
        started_at=timezone.now(),
    )

    inputs, failure_reason = _resolve_inputs(feature_run=feature_run, model_version=model_version)
    if failure_reason:
        run.status = ModelEvaluationRun.Status.FAILED
        run.failure_reason = failure_reason
        run.completed_at = timezone.now()
        run.save(update_fields=["status", "failure_reason", "completed_at", "updated_at"])
        AuditEvent.objects.create(
            institution=institution,
            action="MODEL_EVALUATED",
            outcome=AuditEvent.Outcome.FAILURE,
            metadata={"model_run_id": str(run.id), "reason": failure_reason},
        )
        return run

    evaluated_inputs = {key: str(value) for key, value in inputs.items()}

    try:
        provider = get_provider(model_version.provider_code)
        output = provider.evaluate(model_version=model_version, inputs=inputs)
        if not (definition.score_min <= output.score <= definition.score_max):
            raise ValidationError("Model output score is outside the defined bounds.")
    except Exception as exc:
        run.status = ModelEvaluationRun.Status.FAILED
        run.failure_reason = "PROVIDER_ERROR"
        run.metadata = {"evaluated_inputs": evaluated_inputs, "error_type": type(exc).__name__}
        run.completed_at = timezone.now()
        run.save(
            update_fields=["status", "failure_reason", "metadata", "completed_at", "updated_at"]
        )
        AuditEvent.objects.create(
            institution=institution,
            action="MODEL_EVALUATED",
            outcome=AuditEvent.Outcome.FAILURE,
            metadata={"model_run_id": str(run.id), "reason": run.failure_reason},
        )
        return run

    ModelEvaluationResult.objects.create(
        run=run,
        model_version=model_version,
        score=output.score,
        confidence=output.confidence,
        output_code=output.output_code or "",
        contributions=output.contributions,
        metadata=output.metadata,
    )
    run.status = (
        ModelEvaluationRun.Status.SKIPPED
        if model_version.status == ModelVersion.Status.DRAFT
        else ModelEvaluationRun.Status.SUCCEEDED
    )
    run.metadata = {"evaluated_inputs": evaluated_inputs}
    run.completed_at = timezone.now()
    run.save(update_fields=["status", "metadata", "completed_at", "updated_at"])
    AuditEvent.objects.create(
        institution=institution,
        action="MODEL_EVALUATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "model_run_id": str(run.id),
            "model_version": f"{definition.code}:{model_version.version}",
            "status": run.status,
        },
    )
    return run
