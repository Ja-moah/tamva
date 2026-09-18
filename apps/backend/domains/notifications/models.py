from __future__ import annotations

from django.db import models

from domains.identity.models import User
from domains.partner.models import Institution
from packages.common.models import TimeStampedModel, UUIDModel
from packages.events.models import OutboxEvent


class NotificationChannel(models.TextChoices):
    IN_APP = "IN_APP", "In-app"
    EMAIL = "EMAIL", "Email"
    SMS = "SMS", "SMS"
    PUSH = "PUSH", "Push"


class NotificationTemplate(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=100)
    version = models.CharField(max_length=50)
    category = models.CharField(max_length=50)
    channel = models.CharField(max_length=20, choices=NotificationChannel)
    provider_code = models.CharField(max_length=100)
    subject_template = models.CharField(max_length=255, blank=True)
    body_template = models.TextField()
    mandatory = models.BooleanField(default=False)
    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["code", "version"], name="unique_notification_template_version"
            )
        ]


class NotificationEventBinding(UUIDModel, TimeStampedModel):
    event_type = models.CharField(max_length=100, db_index=True)
    template = models.ForeignKey(
        NotificationTemplate, on_delete=models.PROTECT, related_name="event_bindings"
    )
    active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event_type", "template"], name="unique_notification_event_binding"
            )
        ]


class NotificationPreference(UUIDModel, TimeStampedModel):
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="notification_preferences"
    )
    category = models.CharField(max_length=50)
    channel = models.CharField(max_length=20, choices=NotificationChannel)
    enabled = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "category", "channel"], name="unique_notification_preference"
            )
        ]


class Notification(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SENDING = "SENDING", "Sending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"
        SKIPPED = "SKIPPED", "Skipped"

    institution = models.ForeignKey(
        Institution,
        on_delete=models.PROTECT,
        related_name="notifications",
        blank=True,
        null=True,
    )
    recipient = models.ForeignKey(User, on_delete=models.PROTECT, related_name="notifications")
    template = models.ForeignKey(
        NotificationTemplate, on_delete=models.PROTECT, related_name="notifications"
    )
    channel = models.CharField(max_length=20, choices=NotificationChannel)
    source_event = models.ForeignKey(
        OutboxEvent, on_delete=models.PROTECT, related_name="notifications"
    )
    source_fingerprint = models.CharField(max_length=64)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)
    read_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["source_event", "template", "channel", "recipient", "source_fingerprint"],
                name="unique_notification_input",
            )
        ]
        indexes = [models.Index(fields=["recipient", "created_at"])]


class NotificationDeliveryAttempt(UUIDModel):
    class Status(models.TextChoices):
        SENDING = "SENDING", "Sending"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    notification = models.ForeignKey(
        Notification, on_delete=models.PROTECT, related_name="delivery_attempts"
    )
    provider_code = models.CharField(max_length=100)
    attempt_number = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=Status)
    result_code = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["attempt_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["notification", "attempt_number"], name="unique_notification_attempt"
            )
        ]
