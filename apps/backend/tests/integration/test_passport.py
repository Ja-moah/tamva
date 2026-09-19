import hashlib
import json
from datetime import timedelta

import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.consent.models import ConsentPurpose, ConsentScope
from domains.consent.services import grant_consent
from domains.graph.services import sync_customer_graph
from domains.partner.models import Institution
from domains.passport.models import PassportSectionCode, PassportShare
from domains.passport.services import (
    access_passport_share,
    create_passport_share,
    generate_passport_snapshot,
    revoke_passport_share,
)
from domains.risk.services import create_reference_policy_version, evaluate_risk
from packages.events.models import OutboxEvent
from tests.integration.test_risk import feature_run


def build_chain(context, **kwargs):
    run = feature_run(context, **kwargs)
    policy = create_reference_policy_version()
    evaluate_risk(feature_run=run, policy_version=policy, institution=context[1])
    sync_customer_graph(institution=context[1], customer=context[0])
    return run


def grant_passport_consent(context, *, recipient_institution, purpose_code="passport_sharing"):
    purpose, _ = ConsentPurpose.objects.get_or_create(
        institution=recipient_institution,
        code=purpose_code,
        defaults={"name": "Passport sharing"},
    )
    scope, _ = ConsentScope.objects.get_or_create(
        code="passport:read", defaults={"name": "Read shared passport"}
    )
    grant_consent(
        customer=context[0],
        institution=recipient_institution,
        purpose=purpose,
        scopes=[scope],
        actor=context[0],
        expires_at=timezone.now() + timedelta(days=30),
    )
    return purpose


def make_share(context, *, snapshot, allowed_sections, recipient=None, expires_at=None):
    recipient = recipient or context[2]
    grant_passport_consent(context, recipient_institution=recipient)
    return create_passport_share(
        snapshot=snapshot,
        institution=context[1],
        recipient_institution=recipient,
        purpose_code="passport_sharing",
        allowed_sections=allowed_sections,
        created_by=context[0],
        expires_at=expires_at or (timezone.now() + timedelta(days=7)),
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_trusted_sources_produce_passport_snapshot(normalisation_context):
    build_chain(normalisation_context)

    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    codes = set(snapshot.sections.values_list("code", flat=True))
    assert PassportSectionCode.IDENTITY in codes
    assert PassportSectionCode.FINANCIAL_SUMMARY in codes
    assert PassportSectionCode.SELECTED_RISK_SUMMARY in codes
    assert PassportSectionCode.NETWORK_SUMMARY in codes


@pytest.mark.integration
@pytest.mark.django_db
def test_same_sources_produce_idempotent_snapshot(normalisation_context):
    build_chain(normalisation_context)

    first = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    second = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    assert first.id == second.id


@pytest.mark.integration
@pytest.mark.django_db
def test_new_profile_snapshot_creates_new_passport_snapshot(normalisation_context):
    build_chain(normalisation_context)
    first = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    feature_run(normalisation_context, source_event_id="passport-more", amount="50.00")
    second = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    assert first.id != second.id


@pytest.mark.integration
@pytest.mark.django_db
def test_historical_snapshot_is_unchanged(normalisation_context):
    build_chain(normalisation_context)
    first = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    original_payload = first.sections.get(code=PassportSectionCode.FINANCIAL_SUMMARY).payload

    feature_run(normalisation_context, source_event_id="passport-more-2", amount="75.00")
    generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    first.refresh_from_db()
    assert (
        first.sections.get(code=PassportSectionCode.FINANCIAL_SUMMARY).payload == original_payload
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_creates_scoped_share_succeeds(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    share, token = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[
            PassportSectionCode.FINANCIAL_SUMMARY,
            PassportSectionCode.PROFILE_COMPLETENESS,
        ],
    )

    assert share.status == PassportShare.Status.ACTIVE
    assert token


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_recipient_is_denied(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    share, token = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
    )
    imposter = Institution.objects.create(name="Imposter Bank", slug="imposter-bank")

    with pytest.raises(PermissionDenied):
        access_passport_share(token=token, accessor_institution=imposter)
    assert share.accesses.filter(outcome="DENIED", reason="wrong_recipient").exists()


@pytest.mark.security
@pytest.mark.django_db
def test_expired_share_is_denied(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    share, token = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
        expires_at=timezone.now() - timedelta(seconds=1),
    )

    with pytest.raises(PermissionDenied):
        access_passport_share(token=token, accessor_institution=normalisation_context[2])
    share.refresh_from_db()
    assert share.status == PassportShare.Status.EXPIRED
    assert share.accesses.filter(outcome="DENIED", reason="expired").exists()


@pytest.mark.security
@pytest.mark.django_db
def test_revoked_share_is_denied(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    share, token = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
    )
    revoke_passport_share(
        share=share, institution=normalisation_context[1], revoked_by=normalisation_context[0]
    )

    with pytest.raises(PermissionDenied):
        access_passport_share(token=token, accessor_institution=normalisation_context[2])
    assert share.accesses.filter(outcome="DENIED", reason="revoked").exists()


@pytest.mark.security
@pytest.mark.django_db
def test_scope_not_granted_is_denied(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    share, token = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
    )

    with pytest.raises(PermissionDenied):
        access_passport_share(
            token=token,
            accessor_institution=normalisation_context[2],
            requested_sections=[PassportSectionCode.PROFILE_COMPLETENESS],
        )
    assert share.accesses.filter(outcome="DENIED", reason="scope_not_granted").exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_only_allowed_sections_are_returned(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    _share, token = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[
            PassportSectionCode.FINANCIAL_SUMMARY,
            PassportSectionCode.PROFILE_COMPLETENESS,
        ],
    )

    result = access_passport_share(token=token, accessor_institution=normalisation_context[2])

    assert set(result.keys()) == {
        PassportSectionCode.FINANCIAL_SUMMARY,
        PassportSectionCode.PROFILE_COMPLETENESS,
    }


@pytest.mark.integration
@pytest.mark.django_db
def test_raw_transaction_data_is_never_present(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    for section in snapshot.sections.all():
        serialized = json.dumps(section.payload).lower()
        assert "balance" not in serialized
        assert "example employer" not in serialized  # actual counterparty name
        assert "payroll-1" not in serialized  # actual counterparty reference
        assert "source_account_reference" not in serialized


@pytest.mark.integration
@pytest.mark.django_db
def test_share_token_plaintext_is_never_persisted(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    share, token = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
    )

    assert share.token_hash == hashlib.sha256(token.encode()).hexdigest()
    assert share.token_hash != token
    stored = PassportShare.objects.get(id=share.id)
    assert token not in stored.token_hash


@pytest.mark.integration
@pytest.mark.django_db
def test_share_access_is_audited(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    share, token = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
    )

    access_passport_share(token=token, accessor_institution=normalisation_context[2])

    assert AuditEvent.objects.filter(
        action="PASSPORT_ACCESSED", metadata__share_id=str(share.id)
    ).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_revocation_is_audited_and_outboxed(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    share, _ = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
    )

    revoke_passport_share(
        share=share, institution=normalisation_context[1], revoked_by=normalisation_context[0]
    )

    assert AuditEvent.objects.filter(
        action="PASSPORT_REVOKED", metadata__share_id=str(share.id)
    ).exists()
    assert OutboxEvent.objects.filter(
        event_type="passport.revoked", tenant_id=normalisation_context[1].id
    ).exists()


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_tenant_cannot_create_or_revoke_share(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    other_institution = normalisation_context[2]
    grant_passport_consent(normalisation_context, recipient_institution=other_institution)

    with pytest.raises(PermissionDenied):
        create_passport_share(
            snapshot=snapshot,
            institution=other_institution,
            recipient_institution=other_institution,
            purpose_code="passport_sharing",
            allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
            created_by=normalisation_context[0],
            expires_at=timezone.now() + timedelta(days=7),
        )

    share, _ = make_share(
        normalisation_context,
        snapshot=snapshot,
        allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
    )
    with pytest.raises(PermissionDenied):
        revoke_passport_share(
            share=share, institution=other_institution, revoked_by=normalisation_context[0]
        )


@pytest.mark.integration
@pytest.mark.django_db
def test_sharing_requires_consent(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    with pytest.raises(PermissionDenied, match="Consent access denied"):
        create_passport_share(
            snapshot=snapshot,
            institution=normalisation_context[1],
            recipient_institution=normalisation_context[2],
            purpose_code="passport_sharing",
            allowed_sections=[PassportSectionCode.FINANCIAL_SUMMARY],
            created_by=normalisation_context[0],
            expires_at=timezone.now() + timedelta(days=7),
        )


@pytest.mark.integration
@pytest.mark.django_db
def test_cannot_share_section_not_on_snapshot(normalisation_context):
    build_chain(normalisation_context)
    snapshot = generate_passport_snapshot(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    grant_passport_consent(normalisation_context, recipient_institution=normalisation_context[2])

    with pytest.raises(ValidationError):
        create_passport_share(
            snapshot=snapshot,
            institution=normalisation_context[1],
            recipient_institution=normalisation_context[2],
            purpose_code="passport_sharing",
            allowed_sections=["NOT_A_REAL_SECTION"],
            created_by=normalisation_context[0],
            expires_at=timezone.now() + timedelta(days=7),
        )


@pytest.mark.integration
@pytest.mark.django_db
def test_access_is_denied_and_recorded_once_the_underlying_consent_is_revoked(
    normalisation_context,
):
    from domains.consent.models import Consent
    from domains.consent.services import revoke_consent
    from domains.passport.models import PassportShareAccess

    build_chain(normalisation_context)
    customer, issuer, recipient = normalisation_context[:3]
    snapshot = generate_passport_snapshot(institution=issuer, customer=customer)
    share, token = make_share(
        normalisation_context, snapshot=snapshot, allowed_sections=["FINANCIAL_SUMMARY"]
    )
    assert access_passport_share(token=token, accessor_institution=recipient)

    revoke_consent(
        consent_id=Consent.objects.get(customer=customer, institution=recipient).id,
        institution=recipient,
        actor=customer,
    )

    with pytest.raises(PermissionDenied, match="no longer active"):
        access_passport_share(token=token, accessor_institution=recipient)
    denial = PassportShareAccess.objects.filter(share=share).latest("accessed_at")
    assert denial.outcome == PassportShareAccess.Outcome.DENIED
    assert denial.reason == "consent_not_active"
