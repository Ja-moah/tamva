from __future__ import annotations

from typing import Any
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone

from packages.common.models import TimeStampedModel, UUIDModel


class ConnectorDefinition(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        DISABLED = "DISABLED", "Disabled"

    provider = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=150)
    version = models.CharField(max_length=50, default="1")
    capabilities = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=Status, default=Status.ACTIVE, db_index=True)

    def __str__(self) -> str:
        return self.provider


class InstitutionConnection(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        PAUSED = "PAUSED", "Paused"
        REVOKED = "REVOKED", "Revoked"
        FAILED = "FAILED", "Failed"

    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="connector_connections"
    )
    customer = models.ForeignKey(
        "identity.User", on_delete=models.PROTECT, related_name="institution_connections"
    )
    connector = models.ForeignKey(
        ConnectorDefinition, on_delete=models.PROTECT, related_name="institution_connections"
    )
    external_reference = models.CharField(max_length=200)
    purpose_code = models.SlugField(max_length=100)
    scope_code = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=Status, default=Status.ACTIVE, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    last_synced_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "connector", "external_reference"],
                name="unique_connection_per_institution_provider_reference",
            )
        ]
        indexes = [models.Index(fields=["institution", "status"])]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.customer_id and self.customer.identity_type != "CUSTOMER":
            errors["customer"] = "A connector connection must belong to a customer identity."
        if self.connector_id and self.connector.status != ConnectorDefinition.Status.ACTIVE:
            errors["connector"] = "Only an active connector can be connected."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.institution_id}:{self.connector.provider}:{self.external_reference}"


class ConnectorCredentialReference(UUIDModel, TimeStampedModel):
    connection = models.OneToOneField(
        InstitutionConnection, on_delete=models.PROTECT, related_name="credential_reference"
    )
    reference = models.CharField(max_length=255)
    credential_type = models.CharField(max_length=100, default="provider_reference")
    expires_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    def clean(self) -> None:
        if self.metadata and any(
            key.lower() in {"secret", "token", "password", "private_key"} for key in self.metadata
        ):
            raise ValidationError({"metadata": "Credential secrets must not be stored in TAMVA."})

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class ConnectorSyncRun(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        RUNNING = "RUNNING", "Running"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        FAILED = "FAILED", "Failed"
        RETRYING = "RETRYING", "Retrying"

    connection = models.ForeignKey(
        InstitutionConnection, on_delete=models.PROTECT, related_name="sync_runs"
    )
    status = models.CharField(max_length=20, choices=Status, default=Status.RUNNING, db_index=True)
    cursor = models.CharField(max_length=500, blank=True)
    next_cursor = models.CharField(max_length=500, blank=True)
    attempt = models.PositiveIntegerField(default=1)
    max_attempts = models.PositiveIntegerField(default=3)
    retryable = models.BooleanField(default=False)
    next_retry_at = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(blank=True, null=True)
    accepted_count = models.PositiveIntegerField(default=0)
    duplicate_count = models.PositiveIntegerField(default=0)
    quarantined_count = models.PositiveIntegerField(default=0)
    error_code = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=["connection", "status"])]

    @property
    def institution_id(self) -> UUID:
        return self.connection.institution_id


class RawEvent(UUIDModel):
    class Status(models.TextChoices):
        READY_FOR_NORMALISATION = "READY_FOR_NORMALISATION", "Ready for normalisation"
        QUARANTINED = "QUARANTINED", "Quarantined"

    connection = models.ForeignKey(
        InstitutionConnection, on_delete=models.PROTECT, related_name="raw_events"
    )
    sync_run = models.ForeignKey(
        ConnectorSyncRun, on_delete=models.PROTECT, related_name="raw_events"
    )
    source_event_id = models.CharField(max_length=255, blank=True)
    deduplication_key = models.CharField(max_length=128)
    payload = models.JSONField()
    payload_hash = models.CharField(max_length=64)
    provenance = models.JSONField(default=dict)
    status = models.CharField(max_length=40, choices=Status, db_index=True)
    received_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["connection", "deduplication_key"],
                name="unique_raw_event_deduplication_key",
            ),
            models.UniqueConstraint(
                fields=["connection", "source_event_id"],
                condition=~Q(source_event_id=""),
                name="unique_raw_event_source_id",
            ),
        ]
        indexes = [models.Index(fields=["connection", "status"])]

    def clean(self) -> None:
        if self.sync_run_id and self.connection_id:
            if self.sync_run.connection_id != self.connection_id:
                raise ValidationError({"sync_run": "Raw event sync run must use its connection."})

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self._state.adding and self.pk:
            original = (
                type(self)
                .objects.filter(pk=self.pk)
                .values(
                    "connection_id", "source_event_id", "deduplication_key", "payload", "provenance"
                )
                .first()
            )
            original_data = dict(original) if original else None
            if original_data and any(
                original_data[field] != getattr(self, field)
                for field in (
                    "connection_id",
                    "source_event_id",
                    "deduplication_key",
                    "payload",
                    "provenance",
                )
            ):
                raise ValidationError("Raw event provenance and payload are immutable.")
        self.full_clean()
        super().save(*args, **kwargs)


class IngestionError(UUIDModel):
    sync_run = models.ForeignKey(
        ConnectorSyncRun, on_delete=models.PROTECT, related_name="ingestion_errors"
    )
    raw_event = models.ForeignKey(
        RawEvent, blank=True, null=True, on_delete=models.PROTECT, related_name="ingestion_errors"
    )
    code = models.CharField(max_length=100)
    message = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    retryable = models.BooleanField(default=False)
    attempt = models.PositiveIntegerField(default=1)
    occurred_at = models.DateTimeField(default=timezone.now, db_index=True)


class QuarantineEvent(UUIDModel):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        RELEASED = "RELEASED", "Released"
        DISCARDED = "DISCARDED", "Discarded"

    raw_event = models.OneToOneField(
        RawEvent, on_delete=models.PROTECT, related_name="quarantine_event"
    )
    reason_code = models.CharField(max_length=100)
    reason = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status, default=Status.OPEN, db_index=True)
    quarantined_at = models.DateTimeField(default=timezone.now, db_index=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
