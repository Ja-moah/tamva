"""One continuous, synthetic-data walk of the entire TAMVA backend pipeline.

Every step below calls the real domain service — nothing is faked or
short-circuited — and the flow deliberately proves the tenant and consent
boundaries hold *during* the pipeline, not just at its edges.
"""

from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.case.models import Case
from domains.case.services import (
    create_reference_case_opening_policy_version,
    open_case_from_risk_event,
)
from domains.consent.models import ConsentPurpose, ConsentScope
from domains.consent.services import grant_consent
from domains.feature.services import compute_features, create_default_feature_set
from domains.graph.services import sync_customer_graph
from domains.ledger.services import post_transaction
from domains.modeling.services import evaluate_model
from domains.notifications.models import NotificationEventBinding, NotificationTemplate
from domains.notifications.services import process_outbox_event
from domains.partner.models import Institution
from domains.passport.models import PassportSectionCode
from domains.passport.services import (
    access_passport_share,
    create_passport_share,
    generate_passport_snapshot,
    revoke_passport_share,
)
from domains.profile.services import compute_profile
from domains.risk.services import create_reference_policy_version, evaluate_risk
from packages.events.models import OutboxEvent
from tests.integration.test_ledger import canonical_transaction
from tests.integration.test_modeling import model_definition, model_version
from tests.integration.test_risk import rule_run_for

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


@pytest.mark.e2e
@pytest.mark.django_db
def test_full_backend_flow_from_ingestion_to_revoked_passport_access(normalisation_context):
    customer, institution, other_institution, connection = normalisation_context
    assert connection.customer_id == customer.id
    assert connection.institution_id == institution.id

    # -- RawEvent -> CanonicalTransaction (normalisation) --
    transaction = canonical_transaction(
        normalisation_context, source_event_id="e2e-credit", direction="CREDIT", amount="500.00"
    )

    # -- Ledger --
    posting = post_transaction(transaction_id=transaction.id, institution=institution)
    assert posting.status == "POSTED"

    # -- Financial Profile --
    snapshot = compute_profile(
        customer_id=customer.id,
        institution=institution,
        period_start=PERIOD_START,
        period_end=PERIOD_END,
    )
    assert snapshot.profile.customer_id == customer.id

    # -- Feature Engine --
    feature_set = create_default_feature_set()
    feature_run = compute_features(snapshot=snapshot, feature_set=feature_set)
    assert feature_run.status in {"COMPLETED", "REUSED"}

    # -- Rules Engine (hard-block severity so a case is guaranteed downstream) --
    rule_run = rule_run_for(feature_run, severity="CRITICAL", reason_code="E2E_CRITICAL_SIGNAL")

    # -- Model Interface --
    version = model_version(model_definition(code="e2e_model"))
    model_run = evaluate_model(
        feature_run=feature_run, model_version=version, institution=institution
    )
    assert model_run.status == "SUCCEEDED"

    # -- Risk Engine --
    policy = create_reference_policy_version()
    risk_run = evaluate_risk(
        feature_run=feature_run,
        policy_version=policy,
        institution=institution,
        rule_run=rule_run,
        model_run=model_run,
    )
    risk_event = risk_run.event
    assert risk_event.decision == "BLOCK"

    # Tenant boundary mid-flow: another institution cannot evaluate risk
    # against this feature run.
    with pytest.raises(PermissionDenied):
        evaluate_risk(feature_run=feature_run, policy_version=policy, institution=other_institution)

    # -- Case Management (BLOCK decision must open a case) --
    case_policy = create_reference_case_opening_policy_version()
    case = open_case_from_risk_event(
        risk_event=risk_event, policy_version=case_policy, institution=institution
    )
    assert case is not None
    assert case.status == Case.Status.OPEN

    # -- Notifications (case.created outbox event -> notification) --
    template = NotificationTemplate.objects.create(
        code="e2e-case-created",
        version="1",
        category="CASE",
        channel="IN_APP",
        provider_code="in_app_reference_v1",
        body_template="Case $case_id opened for review.",
    )
    NotificationEventBinding.objects.create(event_type="case.created", template=template)
    case_created_event = (
        OutboxEvent.objects.filter(event_type="case.created", tenant_id=institution.id)
        .order_by("-created_at")
        .first()
    )
    notifications = process_outbox_event(event=case_created_event)
    assert len(notifications) == 1
    assert notifications[0].status == "SENT"

    # -- Trust Graph --
    graph_run = sync_customer_graph(institution=institution, customer=customer)
    assert graph_run.metrics.get(code="account_count").numeric_value == Decimal("1")

    # -- Financial Passport --
    passport_snapshot = generate_passport_snapshot(institution=institution, customer=customer)
    section_codes = set(passport_snapshot.sections.values_list("code", flat=True))
    assert PassportSectionCode.SELECTED_RISK_SUMMARY in section_codes
    assert PassportSectionCode.NETWORK_SUMMARY in section_codes

    # -- PassportShare: sharing is denied before consent exists --
    recipient_institution = Institution.objects.create(
        name="E2E Recipient Bank", slug="e2e-recipient-bank"
    )
    with pytest.raises(PermissionDenied, match="Consent access denied"):
        create_passport_share(
            snapshot=passport_snapshot,
            institution=institution,
            recipient_institution=recipient_institution,
            purpose_code="e2e_passport_sharing",
            allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
            created_by=customer,
            expires_at=timezone.now() + timedelta(days=7),
        )

    # Customer authorizes the recipient institution.
    purpose = ConsentPurpose.objects.create(
        institution=recipient_institution, code="e2e_passport_sharing", name="E2E passport sharing"
    )
    scope = ConsentScope.objects.create(code="passport:read", name="Read shared passport")
    grant_consent(
        customer=customer,
        institution=recipient_institution,
        purpose=purpose,
        scopes=[scope],
        actor=customer,
        expires_at=timezone.now() + timedelta(days=30),
    )

    share, token = create_passport_share(
        snapshot=passport_snapshot,
        institution=institution,
        recipient_institution=recipient_institution,
        purpose_code="e2e_passport_sharing",
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
        created_by=customer,
        expires_at=timezone.now() + timedelta(days=7),
    )

    # -- Authorized recipient access --
    accessed_sections = access_passport_share(
        token=token, accessor_institution=recipient_institution
    )
    assert set(accessed_sections) == {PassportSectionCode.FINANCIAL_SUMMARY}

    # A different institution holding the same token is still denied.
    with pytest.raises(PermissionDenied):
        access_passport_share(token=token, accessor_institution=other_institution)

    # -- Revocation --
    revoke_passport_share(share=share, institution=institution, revoked_by=customer)

    # -- Access denied after revocation --
    with pytest.raises(PermissionDenied):
        access_passport_share(token=token, accessor_institution=recipient_institution)

    # The full chain is auditable end to end.
    audited_actions = set(AuditEvent.objects.values_list("action", flat=True))
    assert {
        "LEDGER_TRANSACTION_POSTED",
        "FEATURES_COMPUTED",
        "RULES_EVALUATED",
        "MODEL_EVALUATED",
        "RISK_EVALUATED",
        "CASE_OPENED",
        "NOTIFICATION_CREATED",
        "NOTIFICATION_DELIVERED",
        "GRAPH_COMPUTED",
        "PASSPORT_GENERATED",
        "PASSPORT_SHARED",
        "PASSPORT_ACCESSED",
        "PASSPORT_ACCESS_DENIED",
        "PASSPORT_REVOKED",
    } <= audited_actions
