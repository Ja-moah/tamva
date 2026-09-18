from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.connector.models import IngestionError, QuarantineEvent, RawEvent
from domains.partner.models import Institution

from .models import CanonicalTransaction

NORMALISATION_VERSION = "1"
SUPPORTED_EVENT_TYPES = {"transaction", "payment", "transfer", "reversal"}
SUPPORTED_CURRENCIES = {
    "GHS",
    "USD",
    "EUR",
    "GBP",
    "NGN",
    "KES",
    "ZAR",
}


@dataclass(frozen=True, slots=True)
class NormalisationResult:
    transaction: CanonicalTransaction | None
    quarantined: bool = False
    duplicate: bool = False


def _raw_event_for_tenant(*, raw_event_id: UUID, institution: Institution) -> RawEvent:
    raw_event = (
        RawEvent.objects.select_related("connection__connector", "connection__customer")
        .filter(id=raw_event_id, connection__institution=institution)
        .first()
    )
    if raw_event is None:
        raise PermissionDenied("Raw event does not belong to the active institution.")
    return raw_event


def _parse_datetime(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    if not isinstance(value, str):
        raise ValueError("timestamp must be an ISO-8601 string")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, UTC)
    return parsed


def _parse_amount(value: Any) -> Decimal:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError("amount must be a valid decimal") from exc
    if not amount.is_finite() or amount <= Decimal("0"):
        raise ValueError("amount must be positive and finite")
    exponent = amount.as_tuple().exponent
    if not isinstance(exponent, int):
        raise ValueError("amount must be finite")
    if exponent < -2:
        raise ValueError("amount supports at most two decimal places")
    return amount.quantize(Decimal("0.01"))


def _map_direction(value: Any) -> str:
    direction = str(value or "").upper()
    if direction not in {"CREDIT", "DEBIT"}:
        raise ValueError("direction must be CREDIT or DEBIT")
    return direction


def _quarantine(raw_event: RawEvent, *, code: str, message: str) -> NormalisationResult:
    raw_event.status = RawEvent.Status.QUARANTINED
    raw_event.save(update_fields=["status"])
    IngestionError.objects.create(
        sync_run=raw_event.sync_run,
        raw_event=raw_event,
        code=code,
        message=message,
        details={"normalisation_version": NORMALISATION_VERSION},
    )
    QuarantineEvent.objects.get_or_create(
        raw_event=raw_event,
        defaults={
            "reason_code": code,
            "reason": message,
            "details": {"normalisation_version": NORMALISATION_VERSION},
        },
    )
    AuditEvent.objects.create(
        institution=raw_event.connection.institution,
        action="NORMALISATION_QUARANTINED",
        outcome=AuditEvent.Outcome.FAILURE,
        metadata={
            "raw_event_id": str(raw_event.id),
            "connection_id": str(raw_event.connection_id),
            "reason_code": code,
        },
    )
    return NormalisationResult(transaction=None, quarantined=True)


@transaction.atomic
def normalise_raw_event(
    *, raw_event_id: UUID, institution: Institution, version: str = NORMALISATION_VERSION
) -> NormalisationResult:
    raw_event = _raw_event_for_tenant(raw_event_id=raw_event_id, institution=institution)
    existing = CanonicalTransaction.objects.filter(raw_event=raw_event).first()
    if existing is not None:
        return NormalisationResult(transaction=existing, duplicate=True)
    if raw_event.status != RawEvent.Status.READY_FOR_NORMALISATION:
        return _quarantine(
            raw_event,
            code="RAW_EVENT_NOT_READY",
            message="Only raw events ready for normalisation can be processed.",
        )

    payload = raw_event.payload
    if not isinstance(payload, dict):
        return _quarantine(
            raw_event, code="MALFORMED_PAYLOAD", message="Provider payload must be an object."
        )
    event_type = str(payload.get("event_type") or "").lower()
    if event_type not in SUPPORTED_EVENT_TYPES:
        return _quarantine(
            raw_event,
            code="UNSUPPORTED_EVENT_TYPE",
            message=f"Unsupported provider event type: {event_type or 'missing'}.",
        )

    try:
        currency = str(payload.get("currency") or "").upper()
        if currency not in SUPPORTED_CURRENCIES:
            raise ValueError("currency is not supported")
        occurred_at = _parse_datetime(payload.get("occurred_at"))
        if occurred_at is None:
            raise ValueError("occurred_at is required")
        posted_at = _parse_datetime(payload.get("posted_at"))
        source_account_reference = str(payload.get("source_account_reference") or "")
        if not source_account_reference:
            raise ValueError("source_account_reference is required")
        status = (
            CanonicalTransaction.Status.REVERSED
            if event_type == "reversal"
            else str(payload.get("status") or "POSTED").upper()
        )
        if status not in CanonicalTransaction.Status.values:
            raise ValueError("status is unsupported")
        transaction_type = str(payload.get("transaction_type") or event_type)
        canonical = CanonicalTransaction.objects.create(
            raw_event=raw_event,
            institution=raw_event.connection.institution,
            customer=raw_event.connection.customer,
            connection=raw_event.connection,
            source_event_id=raw_event.source_event_id,
            source_account_reference=source_account_reference,
            direction=_map_direction(payload.get("direction")),
            transaction_type=transaction_type,
            status=status,
            amount=_parse_amount(payload.get("amount")),
            currency=currency,
            occurred_at=occurred_at,
            posted_at=posted_at,
            counterparty_name=str(payload.get("counterparty_name") or ""),
            counterparty_reference=str(payload.get("counterparty_reference") or ""),
            channel=str(payload.get("channel") or ""),
            merchant_category=str(payload.get("merchant_category") or ""),
            metadata=dict(payload.get("metadata") or {}),
            source_provenance={
                "raw_event_id": str(raw_event.id),
                "source_event_id": raw_event.source_event_id,
                "provider": raw_event.provenance.get("provider"),
                "connector_version": raw_event.provenance.get("connector_version"),
                "received_at": raw_event.received_at.isoformat(),
            },
            normalisation_version=version,
        )
    except (TypeError, ValueError, KeyError) as exc:
        return _quarantine(raw_event, code="INVALID_CANONICAL_RECORD", message=str(exc))

    AuditEvent.objects.create(
        institution=institution,
        action="NORMALISATION_SUCCEEDED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "raw_event_id": str(raw_event.id),
            "canonical_transaction_id": str(canonical.id),
            "normalisation_version": version,
        },
    )
    return NormalisationResult(transaction=canonical)
