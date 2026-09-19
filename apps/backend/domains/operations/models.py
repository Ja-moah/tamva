from __future__ import annotations

from django.conf import settings
from django.db import models

from packages.common.models import TimeStampedModel, UUIDModel


class ResourceType(models.TextChoices):
    RISK_EVENTS = "RISK_EVENTS", "Risk events"
    CASES = "CASES", "Cases"
    CUSTOMERS = "CUSTOMERS", "Customers"
    NOTIFICATIONS = "NOTIFICATIONS", "Notifications"
    SECURITY_EVENTS = "SECURITY_EVENTS", "Security events"
    AUDIT_EVENTS = "AUDIT_EVENTS", "Audit events"


class SavedView(UUIDModel, TimeStampedModel):
    """A private, named combination of filters/ordering/columns for a list screen.

    Filters are stored as plain `{param: string}` pairs and validated against
    the resource's declared filter allow-list on every write; they are never
    evaluated as expressions.
    """

    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.CASCADE, related_name="saved_views"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_views"
    )
    resource_type = models.CharField(max_length=30, choices=ResourceType)
    name = models.CharField(max_length=100)
    filters = models.JSONField(default=dict, blank=True)
    ordering = models.CharField(max_length=200, blank=True)
    visible_columns = models.JSONField(default=list, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "owner", "resource_type", "name"],
                name="unique_saved_view_name_per_owner_resource",
            )
        ]
        indexes = [models.Index(fields=["institution", "owner", "resource_type"])]

    def __str__(self) -> str:
        return f"{self.resource_type}:{self.name}"


class ExportJob(UUIDModel, TimeStampedModel):
    class Format(models.TextChoices):
        CSV = "CSV", "CSV"
        XLSX = "XLSX", "XLSX"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        EXPIRED = "EXPIRED", "Expired"

    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="export_jobs"
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="export_jobs"
    )
    resource_type = models.CharField(max_length=30, choices=ResourceType)
    format = models.CharField(max_length=10, choices=Format)
    filters = models.JSONField(default=dict, blank=True)
    ordering = models.CharField(max_length=200, blank=True)
    columns = models.JSONField(default=list)
    selected_ids = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING, db_index=True)
    row_count = models.PositiveIntegerField(default=0)
    error_code = models.CharField(max_length=100, blank=True)
    artifact = models.FileField(upload_to="exports/", blank=True, max_length=255)
    artifact_size = models.PositiveBigIntegerField(default=0)
    completed_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=["institution", "requested_by", "created_at"]),
            models.Index(fields=["status", "expires_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.resource_type}:{self.format}:{self.status}"


class IdempotencyRecord(UUIDModel, TimeStampedModel):
    """Remembers the outcome of a mutating request keyed by `Idempotency-Key`.

    A repeat with the same key and identical body replays the stored response;
    the same key with a different body is rejected.
    """

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="idempotency_records"
    )
    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.CASCADE, related_name="idempotency_records"
    )
    endpoint = models.CharField(max_length=100)
    key = models.CharField(max_length=128)
    request_hash = models.CharField(max_length=64)
    response = models.JSONField()
    status_code = models.PositiveSmallIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["actor", "institution", "endpoint", "key"],
                name="unique_idempotency_key_per_actor_endpoint",
            )
        ]
