from datetime import UTC, datetime

import pytest

from domains.feature.services import compute_features, create_default_feature_set
from domains.ledger.services import post_transaction
from domains.profile.services import compute_profile
from domains.rules.models import (
    RuleDefinition,
    RuleEvaluationRun,
    RuleSetMembership,
    RuleSetVersion,
)
from domains.rules.services import evaluate_rules
from tests.integration.test_ledger import canonical_transaction

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


def feature_run(context):
    transaction = canonical_transaction(
        context,
        source_event_id="rules-credit",
        direction="CREDIT",
        amount="125.50",
    )
    posting = post_transaction(transaction_id=transaction.id, institution=context[1])
    assert posting
    snapshot = compute_profile(
        customer_id=context[0].id,
        institution=context[1],
        period_start=PERIOD_START,
        period_end=PERIOD_END,
    )
    return compute_features(snapshot=snapshot, feature_set=create_default_feature_set())


def rule_set(feature_code: str, *, operator="GTE", threshold=1, policy="SKIP", version="1"):
    feature = create_default_feature_set().definitions.get(code=feature_code)
    rule = RuleDefinition.objects.create(
        code=f"{feature_code}_{version}",
        name=f"{feature_code} rule",
        feature=feature,
        operator=operator,
        threshold=threshold,
        severity="WARNING",
        reason_code=f"{feature_code.upper()}_CHECK",
        version=version,
        missing_policy=policy,
    )
    rule_version = RuleSetVersion.objects.create(code="core_rules", version=version)
    RuleSetMembership.objects.create(rule_set=rule_version, rule=rule)
    return rule_version


@pytest.mark.integration
@pytest.mark.django_db
def test_rule_matches_and_persists_explanation(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_set("savings_rate")

    result_run = evaluate_rules(feature_run=run, rule_set=rules)
    result = result_run.results.get()

    assert result.matched is True
    assert result.skipped is False
    assert result.observed_value == "1.000000"
    assert result.reason_code == "SAVINGS_RATE_CHECK"
    assert result.expected_value == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_repeated_evaluation_is_idempotent(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_set("savings_rate", threshold=2)

    first = evaluate_rules(feature_run=run, rule_set=rules)
    second = evaluate_rules(feature_run=run, rule_set=rules)

    assert first.id == second.id
    assert second.status == RuleEvaluationRun.Status.REUSED
    assert second.results.count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_missing_feature_policy_is_explicit(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_set("cashflow_consistency", threshold=1, policy="SKIP")

    result = evaluate_rules(feature_run=run, rule_set=rules).results.get()

    assert result.skipped is True
    assert result.matched is None
    assert result.metadata["missing_policy"] == "SKIP"


@pytest.mark.integration
@pytest.mark.django_db
def test_fail_closed_missing_feature_matches(normalisation_context):
    run = feature_run(normalisation_context)
    rules = rule_set("cashflow_consistency", threshold=1, policy="FAIL_CLOSED")

    result = evaluate_rules(feature_run=run, rule_set=rules).results.get()

    assert result.skipped is False
    assert result.matched is True


@pytest.mark.integration
@pytest.mark.django_db
def test_rule_versions_preserve_historical_results(normalisation_context):
    run = feature_run(normalisation_context)
    first_rules = rule_set("savings_rate", threshold=1, version="1")
    second_rules = rule_set("savings_rate", threshold=2, version="2")

    first = evaluate_rules(feature_run=run, rule_set=first_rules)
    second = evaluate_rules(feature_run=run, rule_set=second_rules)

    assert first.id != second.id
    assert first.results.get().matched is True
    assert second.results.get().matched is False
    assert RuleEvaluationRun.objects.filter(feature_run=run).count() == 2
