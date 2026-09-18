from datetime import UTC, datetime
from decimal import Decimal

import pytest
from django.core.exceptions import PermissionDenied, ValidationError

from domains.audit.models import AuditEvent
from domains.feature.services import compute_features, create_default_feature_set
from domains.ledger.services import post_transaction
from domains.modeling.providers import ModelProviderOutput, register_provider
from domains.modeling.services import evaluate_model
from domains.profile.services import compute_profile
from domains.risk.models import RiskEvaluationRun, RiskEvent, RiskPolicyVersion
from domains.risk.services import create_reference_policy_version, evaluate_risk
from domains.rules.models import RuleDefinition, RuleSetMembership, RuleSetVersion
from domains.rules.services import evaluate_rules
from tests.integration.test_ledger import canonical_transaction
from tests.integration.test_modeling import model_definition, model_version

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


def feature_run(context, *, amount="125.50", source_event_id="risk-credit"):
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


def empty_feature_run(context):
    snapshot = compute_profile(
        customer_id=context[0].id,
        institution=context[1],
        period_start=PERIOD_START,
        period_end=PERIOD_END,
    )
    return compute_features(snapshot=snapshot, feature_set=create_default_feature_set())


def rule_run_for(run, *, severity, reason_code, matches=True, version="1"):
    feature = create_default_feature_set().definitions.get(code="savings_rate")
    rule = RuleDefinition.objects.create(
        code=f"risk_rule_{severity}_{reason_code}_{version}",
        name=f"{severity} rule",
        feature=feature,
        operator="GTE" if matches else "LT",
        threshold=0,
        severity=severity,
        reason_code=reason_code,
        version=version,
    )
    rule_set = RuleSetVersion.objects.create(code=f"risk_rules_{reason_code}", version=version)
    RuleSetMembership.objects.create(rule_set=rule_set, rule=rule)
    return evaluate_rules(feature_run=run, rule_set=rule_set)


class FixedScoreProvider:
    def __init__(self, code: str, score: Decimal):
        self.code = code
        self._score = score

    def evaluate(self, *, model_version, inputs):
        return ModelProviderOutput(
            score=self._score,
            confidence=Decimal("0.9"),
            output_code="FIXED",
            contributions=[],
            metadata={},
        )


def model_run_with_fixed_score(context, run, *, score: Decimal, code: str, version="1"):
    register_provider(FixedScoreProvider(code, score))
    version_obj = model_version(
        model_definition(code=f"risk_model_{code}"), version=version, provider_code=code
    )
    return evaluate_model(feature_run=run, model_version=version_obj, institution=context[1])


@pytest.mark.integration
@pytest.mark.django_db
def test_hard_block_rule_produces_block(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_run_for(run, severity="CRITICAL", reason_code="CRITICAL_SIGNAL")
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run, policy_version=policy, institution=normalisation_context[1], rule_run=rules
    )

    event = result_run.event
    assert event.decision == RiskEvent.Decision.BLOCK
    assert event.score == Decimal("1000")
    assert [reason.code for reason in event.reasons.all()] == ["CRITICAL_SIGNAL"]


@pytest.mark.integration
@pytest.mark.django_db
def test_hard_hold_rule_produces_hold(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_run_for(run, severity="HIGH", reason_code="HIGH_SIGNAL")
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run, policy_version=policy, institution=normalisation_context[1], rule_run=rules
    )

    event = result_run.event
    assert event.decision == RiskEvent.Decision.HOLD
    assert event.score == Decimal("900")


@pytest.mark.integration
@pytest.mark.django_db
def test_model_band_allow_end_to_end(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_run_for(run, severity="INFO", reason_code="INFO_ONLY", matches=False)
    model_run = model_run_with_fixed_score(
        normalisation_context, run, score=Decimal("100"), code="allow_band"
    )
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=normalisation_context[1],
        rule_run=rules,
        model_run=model_run,
    )

    event = result_run.event
    assert event.decision == RiskEvent.Decision.ALLOW
    assert event.score == Decimal("100.0000")


@pytest.mark.integration
@pytest.mark.django_db
def test_model_band_challenge_end_to_end(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_run_for(run, severity="INFO", reason_code="INFO_ONLY", matches=False)
    model_run = model_run_with_fixed_score(
        normalisation_context, run, score=Decimal("500"), code="challenge_band"
    )
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=normalisation_context[1],
        rule_run=rules,
        model_run=model_run,
    )

    assert result_run.event.decision == RiskEvent.Decision.CHALLENGE


@pytest.mark.integration
@pytest.mark.django_db
def test_model_band_hold_end_to_end(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_run_for(run, severity="INFO", reason_code="INFO_ONLY", matches=False)
    model_run = model_run_with_fixed_score(
        normalisation_context, run, score=Decimal("800"), code="hold_band"
    )
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=normalisation_context[1],
        rule_run=rules,
        model_run=model_run,
    )

    assert result_run.event.decision == RiskEvent.Decision.HOLD


@pytest.mark.integration
@pytest.mark.django_db
def test_model_band_block_end_to_end(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_run_for(run, severity="INFO", reason_code="INFO_ONLY", matches=False)
    model_run = model_run_with_fixed_score(
        normalisation_context, run, score=Decimal("950"), code="block_band"
    )
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=normalisation_context[1],
        rule_run=rules,
        model_run=model_run,
    )

    assert result_run.event.decision == RiskEvent.Decision.BLOCK


@pytest.mark.integration
@pytest.mark.django_db
def test_repeated_evaluation_is_idempotent(normalisation_context):
    run = feature_run(normalisation_context)
    policy = create_reference_policy_version()

    first = evaluate_risk(
        feature_run=run, policy_version=policy, institution=normalisation_context[1]
    )
    second = evaluate_risk(
        feature_run=run, policy_version=policy, institution=normalisation_context[1]
    )

    assert first.id == second.id
    assert RiskEvaluationRun.objects.filter(feature_run=run, policy_version=policy).count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_new_policy_version_creates_new_risk_event(normalisation_context):
    run = feature_run(normalisation_context)
    first_policy = create_reference_policy_version(version="1")
    second_policy = create_reference_policy_version(version="2")

    first = evaluate_risk(
        feature_run=run, policy_version=first_policy, institution=normalisation_context[1]
    )
    second = evaluate_risk(
        feature_run=run, policy_version=second_policy, institution=normalisation_context[1]
    )

    assert first.id != second.id
    assert RiskEvaluationRun.objects.filter(feature_run=run).count() == 2


@pytest.mark.integration
@pytest.mark.django_db
def test_rule_version_change_produces_traceable_new_result(normalisation_context):
    run = feature_run(normalisation_context)
    policy = create_reference_policy_version()
    first_rules = rule_run_for(
        run, severity="INFO", reason_code="INFO_ONLY", matches=False, version="1"
    )
    second_rules = rule_run_for(
        run, severity="CRITICAL", reason_code="CRITICAL_SIGNAL", version="2"
    )

    first = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=normalisation_context[1],
        rule_run=first_rules,
    )
    second = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=normalisation_context[1],
        rule_run=second_rules,
    )

    assert first.id != second.id
    assert first.event.ruleset_version_id == first_rules.rule_set_version_id
    assert second.event.ruleset_version_id == second_rules.rule_set_version_id
    assert second.event.decision == RiskEvent.Decision.BLOCK


@pytest.mark.integration
@pytest.mark.django_db
def test_model_version_change_produces_traceable_new_result(normalisation_context):
    run = feature_run(normalisation_context)
    policy = create_reference_policy_version()
    rules = rule_run_for(run, severity="INFO", reason_code="INFO_ONLY", matches=False)
    first_model_run = model_run_with_fixed_score(
        normalisation_context, run, score=Decimal("100"), code="version_change_v1", version="1"
    )
    second_model_run = model_run_with_fixed_score(
        normalisation_context, run, score=Decimal("950"), code="version_change_v2", version="2"
    )

    first = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=normalisation_context[1],
        rule_run=rules,
        model_run=first_model_run,
    )
    second = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=normalisation_context[1],
        rule_run=rules,
        model_run=second_model_run,
    )

    assert first.id != second.id
    assert first.event.model_version_id == first_model_run.model_version_id
    assert second.event.model_version_id == second_model_run.model_version_id
    assert first.event.decision == RiskEvent.Decision.ALLOW
    assert second.event.decision == RiskEvent.Decision.BLOCK


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_tenant_cannot_evaluate(normalisation_context):
    run = feature_run(normalisation_context)
    policy = create_reference_policy_version()

    with pytest.raises(PermissionDenied):
        evaluate_risk(feature_run=run, policy_version=policy, institution=normalisation_context[2])
    assert not RiskEvaluationRun.objects.filter(feature_run=run).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_missing_evidence_uses_configured_decision(normalisation_context):
    run = feature_run(normalisation_context)
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run, policy_version=policy, institution=normalisation_context[1]
    )

    event = result_run.event
    assert event.decision == RiskEvent.Decision.CHALLENGE
    assert event.score == Decimal("500")
    codes = {reason.code for reason in event.reasons.all()}
    assert "RULES_UNAVAILABLE" in codes
    assert "MODEL_UNAVAILABLE" in codes


@pytest.mark.integration
@pytest.mark.django_db
def test_low_profile_completeness_triggers_challenge(normalisation_context):
    run = empty_feature_run(normalisation_context)
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run, policy_version=policy, institution=normalisation_context[1]
    )

    event = result_run.event
    assert event.decision == RiskEvent.Decision.CHALLENGE
    codes = {reason.code for reason in event.reasons.all()}
    assert "LOW_PROFILE_COMPLETENESS" in codes


@pytest.mark.integration
@pytest.mark.django_db
def test_historical_risk_event_is_immutable_after_new_policy(normalisation_context):
    run = feature_run(normalisation_context)
    first_policy = create_reference_policy_version(version="1")

    first = evaluate_risk(
        feature_run=run, policy_version=first_policy, institution=normalisation_context[1]
    )
    original_score = first.event.score
    original_decision = first.event.decision

    second_policy = create_reference_policy_version(version="2")
    evaluate_risk(
        feature_run=run, policy_version=second_policy, institution=normalisation_context[1]
    )

    first.refresh_from_db()
    assert first.event.score == original_score
    assert first.event.decision == original_decision


@pytest.mark.integration
@pytest.mark.django_db
def test_risk_evaluation_is_audited(normalisation_context):
    run = feature_run(normalisation_context)
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run, policy_version=policy, institution=normalisation_context[1]
    )

    assert AuditEvent.objects.filter(
        institution=normalisation_context[1],
        action="RISK_EVALUATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata__risk_event_id=str(result_run.event.id),
    ).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_risk_output_contract_fields(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_run_for(run, severity="INFO", reason_code="INFO_ONLY", matches=False)
    model_run = model_run_with_fixed_score(
        normalisation_context, run, score=Decimal("500"), code="contract_check"
    )
    policy = create_reference_policy_version()

    result_run = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=normalisation_context[1],
        rule_run=rules,
        model_run=model_run,
    )

    event = result_run.event
    assert event.id is not None
    assert event.score is not None
    assert event.decision in RiskEvent.Decision.values
    assert list(event.reasons.values_list("code", flat=True))
    assert event.ruleset_version_id == rules.rule_set_version_id
    assert event.model_version_id == model_run.model_version_id
    assert event.policy_version_id == policy.id
    assert event.confidence is not None
    assert event.evaluated_at is not None


@pytest.mark.integration
@pytest.mark.django_db
def test_retired_policy_version_rejects_new_evaluations(normalisation_context):
    run = feature_run(normalisation_context)
    policy = create_reference_policy_version()
    policy.status = RiskPolicyVersion.Status.RETIRED
    policy.save(update_fields=["status"])

    with pytest.raises(ValidationError):
        evaluate_risk(feature_run=run, policy_version=policy, institution=normalisation_context[1])
