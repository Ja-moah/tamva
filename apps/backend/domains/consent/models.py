from __future__ import annotations

from datetime import datetime
from typing import Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils import timezone

from packages.common.models import TimeStampedModel, UUIDModel


class ConsentPurpose(UUIDModel, TimeStampedModel):
    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="consent_purposes"
    )
    code = models.SlugField(max_length=100)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "code"], name="unique_consent_purpose_per_institution"
            )
        ]
        indexes = [models.Index(fields=["institution", "is_active"])]

    def __str__(self) -> str:
        return f"{self.institution_id}:{self.code}"


class ConsentScope(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.code


class Consent(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        GRANTED = "GRANTED", "Granted"
        EXPIRED = "EXPIRED", "Expired"
        REVOKED = "REVOKED", "Revoked"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="consents"
    )
    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="received_consents"
    )
    purpose = models.ForeignKey(ConsentPurpose, on_delete=models.PROTECT, related_name="consents")
    scopes = models.ManyToManyField(ConsentScope, related_name="consents")
    status = models.CharField(max_length=20, choices=Status, default=Status.GRANTED, db_index=True)
    granted_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["institution", "customer", "status"]),
            models.Index(fields=["expires_at", "status"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(expires_at__gt=F("granted_at")),
                name="consent_expiry_after_grant",
            ),
            models.CheckConstraint(
                condition=(
                    Q(status="REVOKED", revoked_at__isnull=False)
                    | (~Q(status="REVOKED") & Q(revoked_at__isnull=True))
                ),
                name="consent_revocation_timestamp_matches_status",
            ),
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.purpose_id and self.institution_id:
            purpose_institution_id = self.purpose.institution_id
            if purpose_institution_id != self.institution_id:
                errors["purpose"] = "Consent purpose must belong to the recipient institution."
        if self.customer_id and self.customer.identity_type != "CUSTOMER":
            errors["customer"] = "Consent can only be granted by a customer identity."
        if self.expires_at and self.granted_at and self.expires_at <= self.granted_at:
            errors["expires_at"] = "Consent expiry must be later than its grant time."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def is_active_at(self, at: datetime | None = None) -> bool:
        checked_at = at or timezone.now()
        return (
            self.status == self.Status.GRANTED
            and self.revoked_at is None
            and self.granted_at <= checked_at < self.expires_at
        )

    def __str__(self) -> str:
        return f"{self.customer_id}:{self.institution_id}:{self.purpose_id}"


class ConsentEventQuerySet(models.QuerySet["ConsentEvent"]):
    def update(self, **kwargs: Any) -> int:
        raise ValidationError("Consent events are immutable.")

    def delete(self) -> tuple[int, dict[str, int]]:
        raise ValidationError("Consent events are immutable.")


class ConsentEvent(UUIDModel):
    class EventType(models.TextChoices):
        GRANTED = "GRANTED", "Granted"
        EXPIRED = "EXPIRED", "Expired"
        REVOKED = "REVOKED", "Revoked"

    consent = models.ForeignKey(Consent, on_delete=models.PROTECT, related_name="events")
    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="consent_events"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="consent_events",
    )
    event_type = models.CharField(max_length=20, choices=EventType, db_index=True)
    snapshot = models.JSONField(default=dict)
    occurred_at = models.DateTimeField(default=timezone.now, db_index=True)
    objects = ConsentEventQuerySet.as_manager()

    class Meta:
        ordering = ["occurred_at", "id"]
        indexes = [models.Index(fields=["institution", "occurred_at"])]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self._state.adding:
            raise ValidationError("Consent events are immutable.")
        super().save(*args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        raise ValidationError("Consent events are immutable.")

    def __str__(self) -> str:
        return f"{self.consent_id}:{self.event_type}"
