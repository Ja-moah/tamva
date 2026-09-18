"""Cross-domain idempotency: replaying the exact same effective input through
every stage of the pipeline must not create a second authoritative record
anywhere. Each domain already has its own idempotency tests in isolation;
this proves the property holds when the stages are chained together, which
is the shape a retried webhook or a re-run pipeline step would actually take.
"""

from datetime import UTC, datetime

import pytest

from domains.case.models import Case
from domains.case.services import (
    create_reference_case_opening_policy_version,
    open_case_from_risk_event,
)
from domains.feature.models import FeatureComputationRun
from domains.feature.services import compute_features, create_default_feature_set
from domains.graph.models import GraphComputationRun
from domains.graph.services import sync_customer_graph
from domains.ledger.models import LedgerPosting
from domains.ledger.services import post_transaction
from domains.modeling.models import ModelEvaluationRun
from domains.modeling.services import evaluate_model
from domains.notifications.models import (
    Notification,
    NotificationEventBinding,
    NotificationTemplate,
)
from domains.notifications.services import process_outbox_event
from domains.passport.models import PassportSnapshot
from domains.passport.services import generate_passport_snapshot
from domains.profile.models import FinancialProfileSnapshot
from domains.profile.services import compute_profile
from domains.risk.models import RiskEvaluationRun
from domains.risk.services import create_reference_policy_version, evaluate_risk
from domains.rules.models import RuleDefinition, RuleSetMembership, RuleSetVersion
from domains.rules.services import evaluate_rules
from packages.events.models import OutboxEvent
from tests.integration.test_ledger import canonical_transaction
from tests.integration.test_modeling import model_definition, model_version

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


@pytest.mark.e2e
@pytest.mark.django_db
def test_replaying_the_same_pipeline_input_does_not_duplicate_records(normalisation_context):
    customer, institution, _, _ = normalisation_context
    transaction = canonical_transaction(
        normalisation_context,
        source_event_id="idempotency-credit",
        direction="CREDIT",
        amount="250.00",
    )

    # Rule/model catalog configuration: created once, exactly as it would be
    # by an admin, before any pipeline run — not re-created on each replay.
    rule_feature = create_default_feature_set().definitions.get(code="savings_rate")
    rule = RuleDefinition.objects.create(
        code="idempotency_rule",
        name="Idempotency rule",
        feature=rule_feature,
        operator="GTE",
        threshold=0,
        severity="CRITICAL",
        reason_code="IDEMPOTENCY_SIGNAL",
    )
    rule_set = RuleSetVersion.objects.create(code="idempotency_rules", version="1")
    RuleSetMembership.objects.create(rule_set=rule_set, rule=rule)
    model_ver = model_version(model_definition(code="idempotency_model"))
    case_policy = create_reference_case_opening_policy_version()
    risk_policy = create_reference_policy_version()
    template, _ = NotificationTemplate.objects.get_or_create(
        code="idempotency-case-created",
        version="1",
        defaults={
            "category": "CASE",
            "channel": "IN_APP",
            "provider_code": "in_app_reference_v1",
            "body_template": "Case $case_id opened.",
        },
    )
    NotificationEventBinding.objects.get_or_create(event_type="case.created", template=template)

    def run_pipeline_once() -> None:
        post_transaction(transaction_id=transaction.id, institution=institution)
        snapshot = compute_profile(
            customer_id=customer.id,
            institution=institution,
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )
        feature_set = create_default_feature_set()
        feature_run = compute_features(snapshot=snapshot, feature_set=feature_set)
        rule_run = evaluate_rules(feature_run=feature_run, rule_set=rule_set)
        model_run = evaluate_model(
            feature_run=feature_run, model_version=model_ver, institution=institution
        )
        risk_run = evaluate_risk(
            feature_run=feature_run,
            policy_version=risk_policy,
            institution=institution,
            rule_run=rule_run,
            model_run=model_run,
        )
        open_case_from_risk_event(
            risk_event=risk_run.event, policy_version=case_policy, institution=institution
        )
        event = (
            OutboxEvent.objects.filter(event_type="case.created", tenant_id=institution.id)
            .order_by("created_at")
            .first()
        )
        process_outbox_event(event=event)
        sync_customer_graph(institution=institution, customer=customer)
        generate_passport_snapshot(institution=institution, customer=customer)

    run_pipeline_once()
    run_pipeline_once()

    assert LedgerPosting.objects.filter(transaction=transaction).count() == 1
    assert FinancialProfileSnapshot.objects.filter(profile__customer=customer).count() == 1
    assert (
        FeatureComputationRun.objects.filter(profile_snapshot__profile__customer=customer).count()
        == 1
    )
    assert RiskEvaluationRun.objects.filter(institution=institution, customer=customer).count() == 1
    assert (
        ModelEvaluationRun.objects.filter(institution=institution, customer=customer).count() == 1
    )
    assert Case.objects.filter(institution=institution, customer=customer).count() == 1
    assert Notification.objects.filter(institution=institution, recipient=customer).count() == 1
    assert (
        GraphComputationRun.objects.filter(institution=institution, customer=customer).count() == 1
    )
    assert (
        PassportSnapshot.objects.filter(
            passport__institution=institution, passport__customer=customer
        ).count()
        == 1
    )
