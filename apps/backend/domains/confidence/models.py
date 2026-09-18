from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.identity.models import User
from domains.partner.models import Institution
from packages.common.models import TimeStampedModel, UUIDModel

from .policy import FinancialConfidenceConfig


class FinancialConfidencePolicy(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["code"]


class FinancialConfidencePolicyVersion(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        RETIRED = "RETIRED", "Retired"

    policy = models.ForeignKey(
        FinancialConfidencePolicy, on_delete=models.PROTECT, related_name="versions"
    )
    version = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status, default=Status.DRAFT)
    configuration = models.JSONField(default=dict)
    activated_at = models.DateTimeField(blank=True, null=True)
    retired_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["policy", "version"], name="unique_confidence_policy_version"
            )
        ]

    def clean(self) -> None:
        FinancialConfidenceConfig.from_dict(self.configuration)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class FinancialConfidenceSnapshot(UUIDModel, TimeStampedModel):
    # Customer-facing informational indicator only: NOT a credit decision,
    # NOT a lending approval, NOT a risk score. Contract: Decimal 0-100,
    # higher = stronger verified financial confidence.
    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="confidence_snapshots"
    )
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="confidence_snapshots"
    )
    policy_version = models.ForeignKey(
        FinancialConfidencePolicyVersion, on_delete=models.PROTECT, related_name="snapshots"
    )
    source_fingerprint = models.CharField(max_length=64)
    score = models.DecimalField(max_digits=6, decimal_places=2)
    band = models.CharField(max_length=30)
    completeness = models.DecimalField(max_digits=5, decimal_places=4)
    provenance = models.JSONField(default=dict)
    evaluated_at = models.DateTimeField()
    is_current = models.BooleanField(default=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "customer", "policy_version", "source_fingerprint"],
                name="unique_confidence_snapshot_input",
            )
        ]
        indexes = [models.Index(fields=["institution", "customer", "is_current"])]

    def clean(self) -> None:
        if not (0 <= self.score <= 100):
            raise ValidationError({"score": "Score must be between 0 and 100."})
        if not (0 <= self.completeness <= 1):
            raise ValidationError({"completeness": "Completeness must be between zero and one."})

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class FinancialConfidenceComponent(UUIDModel):
    snapshot = models.ForeignKey(
        FinancialConfidenceSnapshot, on_delete=models.PROTECT, related_name="components"
    )
    code = models.CharField(max_length=100)
    weight = models.DecimalField(max_digits=5, decimal_places=4)
    value = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    available = models.BooleanField(default=True)
    unavailable_reason = models.CharField(max_length=100, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["snapshot", "code"], name="unique_confidence_component")
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.available and self.value is None:
            errors["value"] = "Available components must have a value."
        if not self.available and not self.unavailable_reason:
            errors["unavailable_reason"] = "Unavailable components require a reason."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)
