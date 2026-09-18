from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.identity.models import User
from domains.partner.models import Institution
from packages.common.models import TimeStampedModel, UUIDModel


class TrustState(models.TextChoices):
    UNKNOWN = "UNKNOWN", "Unknown"
    TRUSTED = "TRUSTED", "Trusted"
    SUSPICIOUS = "SUSPICIOUS", "Suspicious"
    BLOCKED = "BLOCKED", "Blocked"


class Device(UUIDModel, TimeStampedModel):
    """An opaque, institution-scoped device reference.

    `device_key` is supplied by an authorized client/integration — a
    privacy-preserving identifier, not a hardware fingerprint. No invasive
    fingerprinting data is collected here.
    """

    institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name="devices")
    device_key = models.CharField(max_length=255)
    source = models.CharField(max_length=100)
    first_seen_at = models.DateTimeField()
    last_seen_at = models.DateTimeField()
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "device_key"], name="unique_device_per_institution"
            )
        ]


class CustomerDevice(UUIDModel, TimeStampedModel):
    """The tenant-safe join between a customer and a Device, carrying the
    customer-specific trust state (the same physical device could in
    principle be linked to more than one customer at an institution)."""

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="customer_devices"
    )
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name="devices")
    device = models.ForeignKey(Device, on_delete=models.PROTECT, related_name="customer_links")
    status = models.CharField(max_length=20, choices=TrustState, default=TrustState.UNKNOWN)
    first_seen_at = models.DateTimeField()
    last_seen_at = models.DateTimeField()
    observation_count = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["customer", "device"], name="unique_customer_device")
        ]
        indexes = [models.Index(fields=["institution", "customer"])]

    def clean(self) -> None:
        if (
            self.device_id
            and self.institution_id
            and self.device.institution_id != self.institution_id
        ):
            raise ValidationError(
                {"device": "Device institution must match this link's institution."}
            )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class DeviceObservation(UUIDModel):
    """Append-only evidence trail behind a CustomerDevice, one row per
    contributing source record (mirrors GraphEvidence's design)."""

    customer_device = models.ForeignKey(
        CustomerDevice, on_delete=models.PROTECT, related_name="observations"
    )
    source = models.CharField(max_length=100)
    observed_at = models.DateTimeField()
    provenance_type = models.CharField(max_length=100)
    provenance_id = models.UUIDField()
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["observed_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer_device", "provenance_type", "provenance_id"],
                name="unique_device_observation",
            )
        ]


class LocationObservation(UUIDModel):
    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="location_observations"
    )
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="location_observations"
    )
    source = models.CharField(max_length=100)
    country_code = models.CharField(max_length=2)
    region = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=4)
    observed_at = models.DateTimeField()
    provenance_type = models.CharField(max_length=100)
    provenance_id = models.UUIDField()
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["observed_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "provenance_type", "provenance_id"],
                name="unique_location_observation",
            )
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if len(self.country_code) != 2:
            errors["country_code"] = "country_code must be an ISO 3166-1 alpha-2 code."
        if not (0 <= self.confidence <= 1):
            errors["confidence"] = "Confidence must be between zero and one."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.country_code = self.country_code.upper()
        self.full_clean()
        super().save(*args, **kwargs)


class SecurityEvent(UUIDModel, TimeStampedModel):
    class Category(models.TextChoices):
        AUTHENTICATION_FAILURE = "AUTHENTICATION_FAILURE", "Authentication failure"
        NEW_DEVICE = "NEW_DEVICE", "New device"
        UNUSUAL_LOCATION = "UNUSUAL_LOCATION", "Unusual location"
        CREDENTIAL_EVENT = "CREDENTIAL_EVENT", "Credential event"
        CONSENT_SECURITY_EVENT = "CONSENT_SECURITY_EVENT", "Consent security event"
        ACCOUNT_ACCESS_ANOMALY = "ACCOUNT_ACCESS_ANOMALY", "Account access anomaly"

    class Severity(models.TextChoices):
        INFO = "INFO", "Info"
        WARNING = "WARNING", "Warning"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="security_events"
    )
    customer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="security_events",
        blank=True,
        null=True,
    )
    category = models.CharField(max_length=30, choices=Category)
    severity = models.CharField(max_length=20, choices=Severity)
    source = models.CharField(max_length=100)
    occurred_at = models.DateTimeField()
    provenance_type = models.CharField(max_length=100, blank=True)
    provenance_id = models.UUIDField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-occurred_at"]
        indexes = [
            models.Index(fields=["institution", "occurred_at"]),
            models.Index(fields=["customer", "occurred_at"]),
        ]
