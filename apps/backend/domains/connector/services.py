from __future__ import annotations

import hashlib
import json
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.consent.services import require_consent_access
from domains.identity.models import User
from domains.partner.models import Institution

from .models import (
    ConnectorDefinition,
    ConnectorSyncRun,
    IngestionError,
    InstitutionConnection,
    QuarantineEvent,
    RawEvent,
)


@dataclass(frozen=True, slots=True)
class IngestionResult:
    raw_event: RawEvent
    duplicate: bool = False


def _connection_for_tenant(
    *, connection_id: UUID, institution: Institution
) -> InstitutionConnection:
    connection = (
        InstitutionConnection.objects.select_related("connector", "customer", "institution")
        .filter(id=connection_id, institution=institution)
        .first()
    )
    if connection is None:
        raise PermissionDenied("Connection does not belong to the active institution.")
    if not institution.is_active or connection.status != InstitutionConnection.Status.ACTIVE:
        raise ValidationError("Connection is not active for ingestion.")
    if connection.connector.status != ConnectorDefinition.Status.ACTIVE:
        raise ValidationError("Connector is not active for ingestion.")
    return connection


@transaction.atomic
def create_connection(
    *,
    institution: Institution,
    customer_id: UUID,
    connector: ConnectorDefinition,
    external_reference: str,
    purpose_code: str,
    scope_code: str,
    credential_reference: str,
    credential_type: str = "provider_reference",
    metadata: Mapping[str, Any] | None = None,
) -> InstitutionConnection:
    connection = InstitutionConnection.objects.create(
        institution=institution,
        customer_id=customer_id,
        connector=connector,
        external_reference=external_reference,
        purpose_code=purpose_code,
        scope_code=scope_code,
        metadata=dict(metadata or {}),
    )
    from .models import ConnectorCredentialReference

    ConnectorCredentialReference.objects.create(
        connection=connection,
        reference=credential_reference,
        credential_type=credential_type,
    )
    AuditEvent.objects.create(
        institution=institution,
        action="CONNECTOR_CONNECTION_CREATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "connection_id": str(connection.id),
            "connector": connector.provider,
            "customer_id": str(customer_id),
        },
    )
    return connection


@transaction.atomic
def start_sync_run(
    *,
    connection_id: UUID,
    institution: Institution,
    purpose_code: str | None = None,
    scope_code: str | None = None,
    checked_at: datetime | None = None,
) -> ConnectorSyncRun:
    connection = _connection_for_tenant(connection_id=connection_id, institution=institution)
    require_consent_access(
        customer_id=connection.customer_id,
        institution_id=institution.id,
        purpose_code=purpose_code or connection.purpose_code,
        scope_code=scope_code or connection.scope_code,
        checked_at=checked_at,
    )
    sync_run = ConnectorSyncRun.objects.create(connection=connection)
    AuditEvent.objects.create(
        institution=institution,
        action="CONNECTOR_SYNC_STARTED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"connection_id": str(connection.id), "sync_run_id": str(sync_run.id)},
    )
    return sync_run


def _deduplication_key(*, source_event_id: str, payload: Any) -> tuple[str, str]:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str).encode()
    payload_hash = hashlib.sha256(encoded).hexdigest()
    source_key = source_event_id or payload_hash
    return hashlib.sha256(source_key.encode()).hexdigest(), payload_hash


@transaction.atomic
def ingest_raw_events(
    *,
    sync_run_id: UUID,
    institution: Institution,
    events: Iterable[Mapping[str, Any]],
    purpose_code: str | None = None,
    scope_code: str | None = None,
    received_at: datetime | None = None,
) -> list[IngestionResult]:
    sync_run = (
        ConnectorSyncRun.objects.select_for_update()
        .select_related("connection__connector", "connection__customer", "connection__institution")
        .filter(id=sync_run_id, connection__institution=institution)
        .first()
    )
    if sync_run is None:
        raise PermissionDenied("Sync run does not belong to the active institution.")
    connection = _connection_for_tenant(
        connection_id=sync_run.connection_id, institution=institution
    )
    require_consent_access(
        customer_id=connection.customer_id,
        institution_id=institution.id,
        purpose_code=purpose_code or connection.purpose_code,
        scope_code=scope_code or connection.scope_code,
        checked_at=received_at,
    )

    effective_received_at = received_at or timezone.now()
    results: list[IngestionResult] = []
    for event in events:
        payload = event.get("payload")
        source_event_id = str(event.get("source_event_id") or "")
        deduplication_key, payload_hash = _deduplication_key(
            source_event_id=source_event_id, payload=payload
        )
        existing = RawEvent.objects.filter(
            connection=connection, deduplication_key=deduplication_key
        ).first()
        if existing is not None:
            sync_run.duplicate_count += 1
            results.append(IngestionResult(existing, duplicate=True))
            continue

        provenance = {
            **dict(event.get("provenance") or {}),
            "provider": connection.connector.provider,
            "connector_version": connection.connector.version,
            "connection_id": str(connection.id),
            "received_at": effective_received_at.isoformat(),
        }
        is_valid = bool(source_event_id) and isinstance(payload, Mapping)
        raw_event = RawEvent.objects.create(
            connection=connection,
            sync_run=sync_run,
            source_event_id=source_event_id,
            deduplication_key=deduplication_key,
            payload=payload,
            payload_hash=payload_hash,
            provenance=provenance,
            status=(
                RawEvent.Status.READY_FOR_NORMALISATION if is_valid else RawEvent.Status.QUARANTINED
            ),
            received_at=effective_received_at,
        )
        if is_valid:
            sync_run.accepted_count += 1
        else:
            sync_run.quarantined_count += 1
            IngestionError.objects.create(
                sync_run=sync_run,
                raw_event=raw_event,
                code="MALFORMED_PAYLOAD",
                message="Raw event requires a source_event_id and object payload.",
                details={"has_source_event_id": bool(source_event_id)},
            )
            QuarantineEvent.objects.create(
                raw_event=raw_event,
                reason_code="MALFORMED_PAYLOAD",
                reason="Raw event requires a source_event_id and object payload.",
            )
        results.append(IngestionResult(raw_event))

    sync_run.save(
        update_fields=["accepted_count", "duplicate_count", "quarantined_count", "updated_at"]
    )
    return results


@transaction.atomic
def complete_sync_run(
    *, sync_run_id: UUID, institution: Institution, next_cursor: str = ""
) -> ConnectorSyncRun:
    sync_run = (
        ConnectorSyncRun.objects.select_for_update()
        .select_related("connection")
        .filter(id=sync_run_id, connection__institution=institution)
        .first()
    )
    if sync_run is None:
        raise PermissionDenied("Sync run does not belong to the active institution.")
    now = timezone.now()
    sync_run.status = ConnectorSyncRun.Status.SUCCEEDED
    sync_run.next_cursor = next_cursor
    sync_run.finished_at = now
    sync_run.connection.last_synced_at = now
    sync_run.save(update_fields=["status", "next_cursor", "finished_at", "updated_at"])
    sync_run.connection.save(update_fields=["last_synced_at", "updated_at"])
    AuditEvent.objects.create(
        institution=institution,
        action="CONNECTOR_SYNC_SUCCEEDED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"connection_id": str(sync_run.connection_id), "sync_run_id": str(sync_run.id)},
    )
    return sync_run


@transaction.atomic
def fail_sync_run(
    *,
    sync_run_id: UUID,
    institution: Institution,
    code: str,
    message: str,
    retryable: bool = False,
    retry_after: timedelta | None = None,
) -> ConnectorSyncRun:
    sync_run = (
        ConnectorSyncRun.objects.select_for_update()
        .select_related("connection")
        .filter(id=sync_run_id, connection__institution=institution)
        .first()
    )
    if sync_run is None:
        raise PermissionDenied("Sync run does not belong to the active institution.")
    sync_run.status = (
        ConnectorSyncRun.Status.RETRYING if retryable else ConnectorSyncRun.Status.FAILED
    )
    sync_run.retryable = retryable
    sync_run.error_code = code
    sync_run.error_message = message
    sync_run.finished_at = timezone.now()
    sync_run.next_retry_at = timezone.now() + retry_after if retryable and retry_after else None
    sync_run.save(
        update_fields=[
            "status",
            "retryable",
            "error_code",
            "error_message",
            "finished_at",
            "next_retry_at",
            "updated_at",
        ]
    )
    IngestionError.objects.create(
        sync_run=sync_run,
        code=code,
        message=message,
        retryable=retryable,
        attempt=sync_run.attempt,
    )
    AuditEvent.objects.create(
        institution=institution,
        action="CONNECTOR_SYNC_FAILED",
        outcome=AuditEvent.Outcome.FAILURE,
        metadata={
            "connection_id": str(sync_run.connection_id),
            "sync_run_id": str(sync_run.id),
            "code": code,
            "retryable": retryable,
        },
    )
    return sync_run


@transaction.atomic
def revoke_connection(*, connection: InstitutionConnection, actor: User) -> InstitutionConnection:
    """End a connection at the customer's request. Idempotent; no further
    provider fetches are made for a revoked connection."""
    if connection.status == InstitutionConnection.Status.REVOKED:
        return connection
    connection.status = InstitutionConnection.Status.REVOKED
    connection.save(update_fields=["status", "updated_at"])
    AuditEvent.objects.create(
        actor=actor,
        institution=connection.institution,
        action="CONNECTOR_CONNECTION_REVOKED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"connection_id": str(connection.id), "customer_id": str(connection.customer_id)},
    )
    return connection
