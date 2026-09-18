from datetime import timedelta

import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import DatabaseError, connection, transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.consent.models import ConsentEvent, ConsentPurpose, ConsentScope
from domains.consent.services import (
    check_consent_access,
    expire_consent,
    grant_consent,
    require_consent_access,
    revoke_consent,
)
from domains.identity.models import User
from domains.partner.models import Institution


@pytest.fixture
def consent_context():
    customer = User.objects.create_user(
        username="consent-customer",
        email="consent-customer@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.CUSTOMER,
    )
    actor = User.objects.create_user(
        username="consent-operator",
        email="consent-operator@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.PARTNER_USER,
    )
    institution = Institution.objects.create(name="Consent Bank", slug="consent-bank")
    other_institution = Institution.objects.create(name="Other Bank", slug="other-consent-bank")
    purpose = ConsentPurpose.objects.create(
        institution=institution,
        code="affordability-assessment",
        name="Affordability assessment",
    )
    balances = ConsentScope.objects.create(code="balances:read", name="Read balances")
    transactions = ConsentScope.objects.create(code="transactions:read", name="Read transactions")
    return customer, actor, institution, other_institution, purpose, balances, transactions


def grant_active(context, *, granted_at=None, expires_at=None):
    customer, _, institution, _, purpose, balances, _ = context
    now = timezone.now()
    return grant_consent(
        customer=customer,
        institution=institution,
        purpose=purpose,
        scopes=[balances],
        actor=customer,
        granted_at=granted_at or now,
        expires_at=expires_at or now + timedelta(days=30),
    )


@pytest.mark.django_db
def test_active_consent_allows_matching_access(consent_context):
    consent = grant_active(consent_context)
    customer, _, institution, _, purpose, balances, _ = consent_context

    decision = check_consent_access(
        customer_id=customer.id,
        institution_id=institution.id,
        purpose_code=purpose.code,
        scope_code=balances.code,
    )

    assert decision.allowed is True
    assert decision.reason == "active_consent"
    assert decision.consent == consent


@pytest.mark.django_db
def test_expired_consent_blocks_access(consent_context):
    now = timezone.now()
    grant_active(
        consent_context,
        granted_at=now - timedelta(days=2),
        expires_at=now - timedelta(days=1),
    )
    customer, _, institution, _, purpose, balances, _ = consent_context

    decision = check_consent_access(
        customer_id=customer.id,
        institution_id=institution.id,
        purpose_code=purpose.code,
        scope_code=balances.code,
        checked_at=now,
    )

    assert decision.allowed is False


@pytest.mark.django_db
def test_revoked_consent_blocks_access(consent_context):
    consent = grant_active(consent_context)
    customer, _, institution, _, purpose, balances, _ = consent_context
    revoke_consent(consent_id=consent.id, institution=institution, actor=customer)

    decision = check_consent_access(
        customer_id=customer.id,
        institution_id=institution.id,
        purpose_code=purpose.code,
        scope_code=balances.code,
    )

    assert decision.allowed is False


@pytest.mark.django_db
def test_wrong_institution_blocks_access(consent_context):
    grant_active(consent_context)
    customer, _, _, other_institution, purpose, balances, _ = consent_context

    decision = check_consent_access(
        customer_id=customer.id,
        institution_id=other_institution.id,
        purpose_code=purpose.code,
        scope_code=balances.code,
    )

    assert decision.allowed is False


@pytest.mark.django_db
def test_wrong_scope_blocks_access(consent_context):
    grant_active(consent_context)
    customer, _, institution, _, purpose, _, transactions = consent_context

    decision = check_consent_access(
        customer_id=customer.id,
        institution_id=institution.id,
        purpose_code=purpose.code,
        scope_code=transactions.code,
    )

    assert decision.allowed is False
    assert decision.reason == "wrong_scope"


@pytest.mark.django_db
def test_wrong_purpose_blocks_access(consent_context):
    grant_active(consent_context)
    customer, _, institution, _, _, balances, _ = consent_context

    decision = check_consent_access(
        customer_id=customer.id,
        institution_id=institution.id,
        purpose_code="fraud-investigation",
        scope_code=balances.code,
    )

    assert decision.allowed is False
    assert decision.reason == "wrong_purpose"


@pytest.mark.django_db
def test_missing_consent_blocks_access(consent_context):
    customer, _, institution, _, purpose, balances, _ = consent_context

    with pytest.raises(PermissionDenied, match="Consent access denied"):
        require_consent_access(
            customer_id=customer.id,
            institution_id=institution.id,
            purpose_code=purpose.code,
            scope_code=balances.code,
        )


@pytest.mark.django_db
def test_revocation_creates_immutable_event_and_audit_record(consent_context):
    consent = grant_active(consent_context)
    customer, _, institution, _, _, _, _ = consent_context

    revoke_consent(consent_id=consent.id, institution=institution, actor=customer)

    event = consent.events.get(event_type=ConsentEvent.EventType.REVOKED)
    assert event.snapshot["status"] == "REVOKED"
    assert AuditEvent.objects.filter(
        actor=customer,
        institution=institution,
        action="CONSENT_REVOKED",
        outcome=AuditEvent.Outcome.SUCCESS,
    ).exists()
    event.snapshot = {"tampered": True}
    with pytest.raises(ValidationError, match="immutable"):
        event.save()
    with pytest.raises(ValidationError, match="immutable"):
        event.delete()
    with pytest.raises(ValidationError, match="immutable"):
        ConsentEvent.objects.filter(id=event.id).update(snapshot={"tampered": True})
    with pytest.raises(ValidationError, match="immutable"):
        ConsentEvent.objects.filter(id=event.id).delete()
    with pytest.raises(DatabaseError, match="consent events are immutable"):
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE consent_consentevent SET snapshot = '{}'::jsonb WHERE id = %s",
                    [event.id],
                )
    with pytest.raises(DatabaseError, match="consent events are immutable"):
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM consent_consentevent WHERE id = %s", [event.id])


@pytest.mark.django_db
def test_wrong_tenant_cannot_revoke_consent(consent_context):
    consent = grant_active(consent_context)
    customer, _, _, other_institution, _, _, _ = consent_context

    with pytest.raises(PermissionDenied, match="active institution"):
        revoke_consent(consent_id=consent.id, institution=other_institution, actor=customer)


@pytest.mark.django_db
def test_non_customer_actor_cannot_revoke_consent(consent_context):
    consent = grant_active(consent_context)
    _, actor, institution, _, _, _, _ = consent_context

    with pytest.raises(PermissionDenied, match="Only the customer"):
        revoke_consent(consent_id=consent.id, institution=institution, actor=actor)


@pytest.mark.django_db
def test_expiry_transition_creates_event_and_audit_record(consent_context):
    now = timezone.now()
    consent = grant_active(
        consent_context,
        granted_at=now - timedelta(days=2),
        expires_at=now - timedelta(days=1),
    )

    expired = expire_consent(consent_id=consent.id, checked_at=now)

    assert expired.status == expired.Status.EXPIRED
    assert expired.events.filter(event_type=ConsentEvent.EventType.EXPIRED).exists()
    assert AuditEvent.objects.filter(
        institution=expired.institution,
        action="CONSENT_EXPIRED",
        outcome=AuditEvent.Outcome.SUCCESS,
    ).exists()
