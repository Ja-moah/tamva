import json
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from django.core.exceptions import PermissionDenied, ValidationError

from domains.audit.models import AuditEvent
from domains.feature.services import compute_features, create_default_feature_set
from domains.ledger.services import post_transaction
from domains.modeling.models import (
    ModelDefinition,
    ModelEvaluationResult,
    ModelEvaluationRun,
    ModelFeatureBinding,
    ModelVersion,
)
from domains.modeling.providers import get_provider, register_provider
from domains.modeling.services import evaluate_model
from domains.profile.services import compute_profile
from tests.integration.test_ledger import canonical_transaction

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


def feature_run(context, *, amount="125.50", source_event_id="modeling-credit"):
    txn = canonical_transaction(
        context, source_event_id=source_event_id, direction="CREDIT", amount=amount
    )
    posting = post_transaction(transaction_id=txn.id, institution=context[1])
    assert posting
    snapshot = compute_profile(
        customer_id=context[0].id,
        institution=context[1],
        period_start=PERIOD_START,
        period_end=PERIOD_END,
    )
    return compute_features(snapshot=snapshot, feature_set=create_default_feature_set())


def model_definition(*, code="core_credit_model", institution=None):
    return ModelDefinition.objects.create(
        code=code,
        name=code,
        model_type="CREDIT_RISK",
        owner_scope=(
            ModelDefinition.OwnerScope.INSTITUTION
            if institution
            else ModelDefinition.OwnerScope.PLATFORM
        ),
        institution=institution,
        score_min=Decimal("0"),
        score_max=Decimal("1000"),
        score_direction=ModelDefinition.ScoreDirection.HIGHER_IS_RISKIER,
    )


def model_version(
    definition,
    *,
    version="1",
    status=ModelVersion.Status.ACTIVE,
    provider_code="deterministic_reference_v1",
    required_feature="savings_rate",
    optional_feature=None,
    on_missing=ModelFeatureBinding.OnMissing.OMIT,
    default_value=None,
):
    feature_set = create_default_feature_set()
    version_obj = ModelVersion.objects.create(
        model_definition=definition,
        version=version,
        status=status,
        provider_code=provider_code,
        input_contract_version="1",
        output_contract_version="1",
    )
    if required_feature:
        required = feature_set.definitions.get(code=required_feature)
        ModelFeatureBinding.objects.create(
            model_version=version_obj,
            feature=required,
            required=True,
            expected_type=required.value_type,
        )
    if optional_feature:
        optional = feature_set.definitions.get(code=optional_feature)
        ModelFeatureBinding.objects.create(
            model_version=version_obj,
            feature=optional,
            required=False,
            expected_type=optional.value_type,
            on_missing=on_missing,
            default_value=default_value,
        )
    return version_obj


@pytest.mark.integration
@pytest.mark.django_db
def test_valid_feature_run_produces_deterministic_model_output(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(model_definition())

    result_run = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )

    assert result_run.status == ModelEvaluationRun.Status.SUCCEEDED
    result = result_run.result
    assert Decimal("0") <= result.score <= Decimal("1000")
    assert result.output_code == "REFERENCE_EVALUATION"
    assert result.metadata["reference_only"] is True


@pytest.mark.integration
@pytest.mark.django_db
def test_repeated_evaluation_is_idempotent(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(model_definition())

    first = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )
    second = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )

    assert first.id == second.id
    assert ModelEvaluationRun.objects.filter(feature_run=run, model_version=version).count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_new_model_version_creates_new_historical_result(normalisation_context):
    run = feature_run(normalisation_context)
    definition = model_definition()
    first_version = model_version(definition, version="1")
    second_version = model_version(definition, version="2")

    first = evaluate_model(
        feature_run=run, model_version=first_version, institution=normalisation_context[1]
    )
    second = evaluate_model(
        feature_run=run, model_version=second_version, institution=normalisation_context[1]
    )

    assert first.id != second.id
    assert ModelEvaluationRun.objects.filter(feature_run=run).count() == 2
    assert first.result.model_version_id == first_version.id
    assert second.result.model_version_id == second_version.id


@pytest.mark.integration
@pytest.mark.django_db
def test_historical_result_is_immutable_after_new_version(normalisation_context):
    run = feature_run(normalisation_context)
    definition = model_definition()
    first_version = model_version(definition, version="1")

    first = evaluate_model(
        feature_run=run, model_version=first_version, institution=normalisation_context[1]
    )
    original_score = first.result.score

    second_version = model_version(definition, version="2")
    evaluate_model(
        feature_run=run, model_version=second_version, institution=normalisation_context[1]
    )

    first.refresh_from_db()
    assert first.result.score == original_score


@pytest.mark.integration
@pytest.mark.django_db
def test_missing_required_feature_fails_explicitly(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(model_definition(), required_feature="cashflow_consistency")

    result_run = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )

    assert result_run.status == ModelEvaluationRun.Status.FAILED
    assert result_run.failure_reason == "MISSING_REQUIRED_FEATURE:cashflow_consistency"
    assert not ModelEvaluationResult.objects.filter(run=result_run).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_optional_unavailable_feature_uses_configured_default(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(
        model_definition(),
        optional_feature="cashflow_consistency",
        on_missing=ModelFeatureBinding.OnMissing.DEFAULT,
        default_value="0.5",
    )

    result_run = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )

    assert result_run.status == ModelEvaluationRun.Status.SUCCEEDED
    assert result_run.metadata["evaluated_inputs"]["cashflow_consistency"] == "0.5"


@pytest.mark.integration
@pytest.mark.django_db
def test_optional_unavailable_feature_can_be_configured_to_fail(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(
        model_definition(),
        optional_feature="cashflow_consistency",
        on_missing=ModelFeatureBinding.OnMissing.FAIL,
    )

    result_run = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )

    assert result_run.status == ModelEvaluationRun.Status.FAILED
    assert result_run.failure_reason == "MISSING_OPTIONAL_FEATURE:cashflow_consistency"


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_tenant_cannot_evaluate(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(model_definition())

    with pytest.raises(PermissionDenied):
        evaluate_model(feature_run=run, model_version=version, institution=normalisation_context[2])
    assert not ModelEvaluationRun.objects.filter(feature_run=run).exists()


@pytest.mark.security
@pytest.mark.django_db
def test_institution_scoped_model_denied_to_other_institution(normalisation_context):
    run = feature_run(normalisation_context)
    other_institution = normalisation_context[2]
    version = model_version(model_definition(institution=other_institution))

    with pytest.raises(PermissionDenied):
        evaluate_model(feature_run=run, model_version=version, institution=normalisation_context[1])


@pytest.mark.integration
@pytest.mark.django_db
def test_input_snapshot_provenance_is_preserved(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(model_definition())

    result_run = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )

    assert "savings_rate" in result_run.metadata["evaluated_inputs"]
    assert result_run.metadata["evaluated_inputs"]["savings_rate"] == "1.000000"


@pytest.mark.unit
@pytest.mark.django_db
def test_reference_provider_is_deterministic(normalisation_context):
    version = model_version(model_definition())
    provider = get_provider("deterministic_reference_v1")

    first = provider.evaluate(model_version=version, inputs={"savings_rate": "1.0"})
    second = provider.evaluate(model_version=version, inputs={"savings_rate": "1.0"})

    assert first.score == second.score
    assert first.contributions == second.contributions


@pytest.mark.integration
@pytest.mark.django_db
def test_draft_model_version_produces_skipped_run(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(model_definition(), status=ModelVersion.Status.DRAFT)

    result_run = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )

    assert result_run.status == ModelEvaluationRun.Status.SKIPPED
    assert result_run.result is not None


@pytest.mark.integration
@pytest.mark.django_db
def test_retired_model_version_rejects_new_evaluations(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(model_definition(), status=ModelVersion.Status.RETIRED)

    with pytest.raises(ValidationError):
        evaluate_model(feature_run=run, model_version=version, institution=normalisation_context[1])


@pytest.mark.integration
@pytest.mark.django_db
def test_model_evaluation_is_audited(normalisation_context):
    run = feature_run(normalisation_context)
    version = model_version(model_definition())

    result_run = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )

    assert AuditEvent.objects.filter(
        institution=normalisation_context[1],
        action="MODEL_EVALUATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata__model_run_id=str(result_run.id),
    ).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_provider_failure_produces_sanitized_failed_run(normalisation_context):
    class FailingProvider:
        code = "failing_test_provider"

        def evaluate(self, *, model_version, inputs):
            raise RuntimeError("leaked secret stack trace details")

    register_provider(FailingProvider())
    run = feature_run(normalisation_context)
    version = model_version(model_definition(), provider_code="failing_test_provider")

    result_run = evaluate_model(
        feature_run=run, model_version=version, institution=normalisation_context[1]
    )

    assert result_run.status == ModelEvaluationRun.Status.FAILED
    assert result_run.failure_reason == "PROVIDER_ERROR"
    assert result_run.metadata["error_type"] == "RuntimeError"
    assert "leaked secret" not in json.dumps(result_run.metadata)
    assert AuditEvent.objects.filter(
        action="MODEL_EVALUATED",
        outcome=AuditEvent.Outcome.FAILURE,
        metadata__model_run_id=str(result_run.id),
    ).exists()
