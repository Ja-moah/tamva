from decimal import Decimal

import pytest
from django.core.exceptions import PermissionDenied, ValidationError

from domains.connector.models import RawEvent
from domains.connector.services import ingest_raw_events, start_sync_run
from domains.normalisation.models import CanonicalTransaction
from domains.normalisation.services import normalise_raw_event


def create_raw_event(context, payload, *, source_event_id="source-1"):
    _, institution, _, connection = context
    sync_run = start_sync_run(connection_id=connection.id, institution=institution)
    return ingest_raw_events(
        sync_run_id=sync_run.id,
        institution=institution,
        events=[
            {
                "source_event_id": source_event_id,
                "payload": payload,
                "provenance": {"provider_cursor": "cursor-7"},
            }
        ],
    )[0].raw_event


def valid_payload(**overrides):
    payload = {
        "event_type": "transaction",
        "amount": "125.50",
        "currency": "GHS",
        "direction": "CREDIT",
        "status": "POSTED",
        "transaction_type": "cash_deposit",
        "occurred_at": "2026-09-17T10:30:00Z",
        "posted_at": "2026-09-17T10:31:00Z",
        "source_account_reference": "acct-source-1",
        "counterparty_name": "Example Employer",
        "counterparty_reference": "payroll-1",
        "channel": "bank_transfer",
        "merchant_category": "salary",
        "metadata": {"provider_label": "PAYROLL"},
    }
    payload.update(overrides)
    return payload


@pytest.mark.integration
@pytest.mark.django_db
def test_valid_raw_event_creates_traceable_canonical_transaction(normalisation_context):
    raw_event = create_raw_event(normalisation_context, valid_payload())

    result = normalise_raw_event(
        raw_event_id=raw_event.id, institution=normalisation_context[1], version="2026.1"
    )

    transaction = result.transaction
    assert transaction is not None
    assert transaction.amount == Decimal("125.50")
    assert transaction.direction == CanonicalTransaction.Direction.CREDIT
    assert transaction.normalisation_version == "2026.1"
    assert transaction.raw_event_id == raw_event.id
    assert transaction.source_provenance["provider"] == "normalisation-provider"
    assert transaction.source_provenance["raw_event_id"] == str(raw_event.id)


@pytest.mark.integration
@pytest.mark.django_db
def test_reprocessing_same_raw_event_is_idempotent(normalisation_context):
    raw_event = create_raw_event(normalisation_context, valid_payload())
    first = normalise_raw_event(raw_event_id=raw_event.id, institution=normalisation_context[1])
    second = normalise_raw_event(raw_event_id=raw_event.id, institution=normalisation_context[1])

    assert first.transaction is not None
    assert second.transaction is not None
    assert second.transaction.id == first.transaction.id
    assert second.duplicate is True
    assert CanonicalTransaction.objects.filter(raw_event=raw_event).count() == 1


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_tenant_is_denied(normalisation_context):
    raw_event = create_raw_event(normalisation_context, valid_payload())

    with pytest.raises(PermissionDenied, match="active institution"):
        normalise_raw_event(raw_event_id=raw_event.id, institution=normalisation_context[2])


@pytest.mark.integration
@pytest.mark.django_db
@pytest.mark.parametrize(
    ("payload_override", "reason"),
    [
        ({"amount": "not-a-number"}, "INVALID_CANONICAL_RECORD"),
        ({"currency": "ZZZ"}, "INVALID_CANONICAL_RECORD"),
        ({"event_type": "balance_snapshot"}, "UNSUPPORTED_EVENT_TYPE"),
        ({"source_account_reference": ""}, "INVALID_CANONICAL_RECORD"),
    ],
)
def test_invalid_or_unsupported_event_is_quarantined(
    normalisation_context, payload_override, reason
):
    raw_event = create_raw_event(normalisation_context, valid_payload(**payload_override))

    result = normalise_raw_event(raw_event_id=raw_event.id, institution=normalisation_context[1])

    assert result.transaction is None
    assert result.quarantined is True
    raw_event.refresh_from_db()
    assert raw_event.status == RawEvent.Status.QUARANTINED
    assert raw_event.quarantine_event.reason_code == reason


@pytest.mark.integration
@pytest.mark.django_db
@pytest.mark.parametrize(
    ("direction", "expected"),
    [
        ("CREDIT", CanonicalTransaction.Direction.CREDIT),
        ("DEBIT", CanonicalTransaction.Direction.DEBIT),
    ],
)
def test_provider_direction_maps_to_canonical_direction(normalisation_context, direction, expected):
    raw_event = create_raw_event(
        normalisation_context, valid_payload(direction=direction), source_event_id=direction
    )

    result = normalise_raw_event(raw_event_id=raw_event.id, institution=normalisation_context[1])

    assert result.transaction is not None
    assert result.transaction.direction == expected


@pytest.mark.integration
@pytest.mark.django_db
def test_reversal_is_explicit_and_does_not_delete_source(normalisation_context):
    raw_event = create_raw_event(
        normalisation_context,
        valid_payload(event_type="reversal", status="POSTED"),
        source_event_id="reversal-1",
    )

    result = normalise_raw_event(raw_event_id=raw_event.id, institution=normalisation_context[1])

    assert result.transaction is not None
    assert result.transaction.status == CanonicalTransaction.Status.REVERSED
    assert RawEvent.objects.filter(id=raw_event.id).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_raw_payload_and_provenance_remain_unchanged(normalisation_context):
    payload = valid_payload()
    raw_event = create_raw_event(normalisation_context, payload)
    original_payload = raw_event.payload
    original_provenance = raw_event.provenance

    normalise_raw_event(raw_event_id=raw_event.id, institution=normalisation_context[1])

    raw_event.refresh_from_db()
    assert raw_event.payload == original_payload
    assert raw_event.provenance == {
        **original_provenance,
        "provider": "normalisation-provider",
        "connector_version": "2.1",
        "connection_id": str(raw_event.connection_id),
        "received_at": raw_event.provenance["received_at"],
    }
    transaction = raw_event.canonical_transaction
    transaction.source_provenance = {"tampered": True}
    with pytest.raises(ValidationError, match="provenance is immutable"):
        transaction.save()
