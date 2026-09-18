from datetime import timedelta

import pytest
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.connector.models import (
    ConnectorDefinition,
    ConnectorSyncRun,
    QuarantineEvent,
    RawEvent,
)
from domains.connector.services import (
    complete_sync_run,
    create_connection,
    fail_sync_run,
    ingest_raw_events,
    start_sync_run,
)
from domains.consent.models import ConsentPurpose, ConsentScope
from domains.consent.services import grant_consent, revoke_consent
from domains.identity.models import User
from domains.partner.models import Institution


@pytest.fixture
def ingestion_context():
    customer = User.objects.create_user(
        username="connector-customer",
        email="connector-customer@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.CUSTOMER,
    )
    institution = Institution.objects.create(name="Connector Bank", slug="connector-bank")
    other_institution = Institution.objects.create(name="Other Bank", slug="other-bank")
    purpose = ConsentPurpose.objects.create(
        institution=institution, code="data-ingestion", name="Data ingestion"
    )
    scope = ConsentScope.objects.create(code="transactions:read", name="Read transactions")
    connector = ConnectorDefinition.objects.create(
        provider="test-provider", name="Test Provider", version="2026.1"
    )
    connection = create_connection(
        institution=institution,
        customer_id=customer.id,
        connector=connector,
        external_reference="account-123",
        purpose_code=purpose.code,
        scope_code=scope.code,
        credential_reference="vault://connector/account-123",
    )
    return customer, institution, other_institution, purpose, scope, connection


def grant_active(context, *, expires_at=None):
    customer, institution, _, purpose, scope, _ = context
    now = timezone.now()
    return grant_consent(
        customer=customer,
        institution=institution,
        purpose=purpose,
        scopes=[scope],
        actor=customer,
        granted_at=(expires_at - timedelta(days=1) if expires_at else now),
        expires_at=expires_at or now + timedelta(days=30),
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_valid_consent_ingests_with_provenance_and_audit(ingestion_context):
    context = ingestion_context
    customer, institution, _, _, _, connection = context
    grant_active(context)
    run = start_sync_run(connection_id=connection.id, institution=institution)

    results = ingest_raw_events(
        sync_run_id=run.id,
        institution=institution,
        events=[
            {
                "source_event_id": "evt-1",
                "payload": {"amount": "12.50", "currency": "GHS"},
                "provenance": {"cursor": "cursor-1", "transport": "pull"},
            }
        ],
    )
    complete_sync_run(sync_run_id=run.id, institution=institution, next_cursor="cursor-2")

    event = results[0].raw_event
    assert event.status == RawEvent.Status.READY_FOR_NORMALISATION
    assert event.provenance["provider"] == "test-provider"
    assert event.provenance["cursor"] == "cursor-1"
    assert AuditEvent.objects.filter(
        institution=institution,
        action="CONNECTOR_SYNC_SUCCEEDED",
        outcome=AuditEvent.Outcome.SUCCESS,
    ).exists()
    assert customer.id == connection.customer_id


@pytest.mark.integration
@pytest.mark.django_db
@pytest.mark.parametrize("consent_state", ["revoked", "expired"])
def test_invalid_consent_blocks_fetch_and_ingestion(ingestion_context, consent_state):
    context = ingestion_context
    customer, institution, _, _, _, connection = context
    consent = grant_active(
        context,
        expires_at=(
            timezone.now() - timedelta(minutes=1)
            if consent_state == "expired"
            else timezone.now() + timedelta(days=30)
        ),
    )
    if consent_state == "revoked":
        revoke_consent(consent_id=consent.id, institution=institution, actor=customer)

    with pytest.raises(PermissionDenied, match="Consent access denied"):
        start_sync_run(connection_id=connection.id, institution=institution)


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_tenant_cannot_start_or_ingest(ingestion_context):
    _, institution, other_institution, _, _, connection = ingestion_context
    grant_active(ingestion_context)

    with pytest.raises(PermissionDenied, match="active institution"):
        start_sync_run(connection_id=connection.id, institution=other_institution)

    assert not ConnectorSyncRun.objects.filter(connection=connection).exists()
    assert institution.id != other_institution.id


@pytest.mark.integration
@pytest.mark.django_db
def test_duplicate_source_event_is_idempotent(ingestion_context):
    grant_active(ingestion_context)
    _, institution, _, _, _, connection = ingestion_context
    run = start_sync_run(connection_id=connection.id, institution=institution)
    event = {"source_event_id": "evt-duplicate", "payload": {"amount": "10"}}

    first = ingest_raw_events(sync_run_id=run.id, institution=institution, events=[event])
    second = ingest_raw_events(sync_run_id=run.id, institution=institution, events=[event])

    assert RawEvent.objects.filter(connection=connection).count() == 1
    assert first[0].raw_event.id == second[0].raw_event.id
    assert second[0].duplicate is True


@pytest.mark.integration
@pytest.mark.django_db
def test_malformed_payload_is_quarantined(ingestion_context):
    grant_active(ingestion_context)
    _, institution, _, _, _, connection = ingestion_context
    run = start_sync_run(connection_id=connection.id, institution=institution)

    result = ingest_raw_events(
        sync_run_id=run.id,
        institution=institution,
        events=[{"source_event_id": "evt-bad", "payload": ["not", "an", "object"]}],
    )[0]

    assert result.raw_event.status == RawEvent.Status.QUARANTINED
    assert QuarantineEvent.objects.filter(
        raw_event=result.raw_event, reason_code="MALFORMED_PAYLOAD"
    ).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_failed_and_retryable_sync_records_metadata(ingestion_context):
    grant_active(ingestion_context)
    _, institution, _, _, _, connection = ingestion_context
    failed = start_sync_run(connection_id=connection.id, institution=institution)
    failed = fail_sync_run(
        sync_run_id=failed.id,
        institution=institution,
        code="PROVIDER_UNAVAILABLE",
        message="Provider timed out.",
    )
    retrying = start_sync_run(connection_id=connection.id, institution=institution)
    retrying = fail_sync_run(
        sync_run_id=retrying.id,
        institution=institution,
        code="RATE_LIMITED",
        message="Retry later.",
        retryable=True,
        retry_after=timedelta(minutes=5),
    )

    assert failed.status == ConnectorSyncRun.Status.FAILED
    assert retrying.status == ConnectorSyncRun.Status.RETRYING
    assert retrying.retryable is True
    assert retrying.next_retry_at is not None
    assert retrying.ingestion_errors.get(code="RATE_LIMITED").retryable is True
