import uuid

from django.conf import settings
from django.db import models


class AuditEvent(models.Model):
    class Outcome(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        FAILURE = "FAILURE", "Failure"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="audit_events",
    )
    institution = models.ForeignKey(
        "partner.Institution",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="audit_events",
    )
    action = models.CharField(max_length=100)
    outcome = models.CharField(max_length=20, choices=Outcome, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["actor", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.action}:{self.outcome}"
