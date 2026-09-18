import uuid
from datetime import UTC, datetime

import pytest

from domains.feature.services import compute_intelligence_features, create_intelligence_feature_set
from domains.ledger.services import post_transaction
from domains.profile.services import compute_profile
from domains.risk.models import RiskEvent
from domains.risk.services import create_reference_policy_version, evaluate_risk
from domains.rules.models import RuleDefinition, RuleSetMembership, RuleSetVersion
from domains.rules.services import evaluate_rules
from domains.security.services import observe_device
from tests.integration.test_ledger import canonical_transaction

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


def intelligence_run_with_new_device(context):
    txn = canonical_transaction(
        context, source_event_id="irr-1", occurred_at="2026-09-30T12:00:00Z", amount="80.00"
    )
    post_transaction(transaction_id=txn.id, institution=context[1])
    observe_device(
        institution=context[1],
        customer=context[0],
        device_key="irr-device",
        source="mobile_app",
        provenance_type="a",
        provenance_id=uuid.uuid4(),
        observed_at=datetime(2026, 9, 30, 12, 0, tzinfo=UTC),
    )
    snapshot = compute_profile(
        customer_id=context[0].id,
        institution=context[1],
        period_start=PERIOD_START,
        period_end=PERIOD_END,
    )
    return compute_intelligence_features(
        snapshot=snapshot, feature_set=create_intelligence_feature_set()
    )


def boolean_rule_set(feature_code, *, reason_code, severity):
    feature = create_intelligence_feature_set().definitions.get(code=feature_code)
    rule = RuleDefinition.objects.create(
        code=f"{feature_code}_rule",
        name=f"{feature_code} rule",
        feature=feature,
        operator="EQ",
        threshold=True,
        severity=severity,
        reason_code=reason_code,
    )
    rule_set = RuleSetVersion.objects.create(code=f"{feature_code}_rules", version="1")
    RuleSetMembership.objects.create(rule_set=rule_set, rule=rule)
    return rule_set


@pytest.mark.integration
@pytest.mark.django_db
def test_boolean_signal_rule_matches_and_carries_reason_code(normalisation_context):
    run = intelligence_run_with_new_device(normalisation_context)
    rule_set = boolean_rule_set("new_device_flag", reason_code="DEVICE_NEW", severity="WARNING")

    result = evaluate_rules(feature_run=run, rule_set=rule_set).results.get()

    assert result.matched is True
    assert result.reason_code == "DEVICE_NEW"


@pytest.mark.integration
@pytest.mark.django_db
def test_signal_reason_code_flows_through_to_risk_reasons(normalisation_context):
    run = intelligence_run_with_new_device(normalisation_context)
    rule_set = boolean_rule_set("new_device_flag", reason_code="DEVICE_NEW", severity="HIGH")
    rule_run = evaluate_rules(feature_run=run, rule_set=rule_set)

    risk_run = evaluate_risk(
        feature_run=run,
        policy_version=create_reference_policy_version(),
        institution=normalisation_context[1],
        rule_run=rule_run,
    )

    event = risk_run.event
    assert event.decision == RiskEvent.Decision.HOLD
    assert [reason.code for reason in event.reasons.all()] == ["DEVICE_NEW"]


@pytest.mark.integration
@pytest.mark.django_db
def test_signal_reason_codes_reach_case_notification_context(normalisation_context):
    from domains.case.services import (
        create_reference_case_opening_policy_version,
        open_case_from_risk_event,
    )
    from packages.events.models import OutboxEvent

    run = intelligence_run_with_new_device(normalisation_context)
    rule_set = boolean_rule_set("new_device_flag", reason_code="DEVICE_NEW", severity="HIGH")
    rule_run = evaluate_rules(feature_run=run, rule_set=rule_set)
    risk_run = evaluate_risk(
        feature_run=run,
        policy_version=create_reference_policy_version(),
        institution=normalisation_context[1],
        rule_run=rule_run,
    )

    open_case_from_risk_event(
        risk_event=risk_run.event,
        policy_version=create_reference_case_opening_policy_version(),
        institution=normalisation_context[1],
    )

    event = OutboxEvent.objects.get(event_type="case.created")
    assert event.payload["reason_codes"] == "DEVICE_NEW"
