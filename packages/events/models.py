import uuid

from django.db import models

from packages.common.models import TimeStampedModel, UUIDModel


class OutboxEvent(UUIDModel, TimeStampedModel):
    event_type = models.CharField(max_length=200)
    event_version = models.PositiveIntegerField(default=1)
    occurred_at = models.DateTimeField()
    producer = models.CharField(max_length=100)
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)
    correlation_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    payload = models.JSONField()
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    attempts = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)

    class Meta:
        indexes = [models.Index(fields=["published_at", "occurred_at"])]
        ordering = ["occurred_at"]
