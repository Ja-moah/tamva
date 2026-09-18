from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.identity.models import User
from domains.partner.models import Institution
from domains.profile.models import FinancialProfileSnapshot
from packages.common.models import TimeStampedModel, UUIDModel


class FeatureDefinition(UUIDModel, TimeStampedModel):
    class ValueType(models.TextChoices):
        DECIMAL = "DECIMAL", "Decimal"
        BOOLEAN = "BOOLEAN", "Boolean"
        CATEGORICAL = "CATEGORICAL", "Categorical"

    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    value_type = models.CharField(max_length=20, choices=ValueType)
    unit = models.CharField(max_length=50, blank=True)
    version = models.CharField(max_length=50, default="1")
    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["code"]


class FeatureSetVersion(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        RETIRED = "RETIRED", "Retired"

    code = models.CharField(max_length=100)
    version = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status, default=Status.DRAFT)
    activated_at = models.DateTimeField(blank=True, null=True)
    retired_at = models.DateTimeField(blank=True, null=True)
    definitions: models.ManyToManyField[FeatureDefinition, FeatureSetMembership] = (
        models.ManyToManyField(
            FeatureDefinition, through="FeatureSetMembership", related_name="feature_sets"
        )
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["code", "version"], name="unique_feature_set_version")
        ]


class FeatureSetMembership(UUIDModel):
    feature_set = models.ForeignKey(FeatureSetVersion, on_delete=models.PROTECT)
    definition = models.ForeignKey(FeatureDefinition, on_delete=models.PROTECT)
    ordinal = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordinal", "definition__code"]
        constraints = [
            models.UniqueConstraint(
                fields=["feature_set", "definition"], name="unique_feature_set_definition"
            )
        ]


class FeatureComputationRun(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        REUSED = "REUSED", "Reused"
        FAILED = "FAILED", "Failed"

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="feature_computation_runs"
    )
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="feature_computation_runs"
    )
    profile_snapshot = models.ForeignKey(
        FinancialProfileSnapshot, on_delete=models.PROTECT, related_name="feature_runs"
    )
    feature_set_version = models.ForeignKey(
        FeatureSetVersion, on_delete=models.PROTECT, related_name="computation_runs"
    )
    source_fingerprint = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=Status, default=Status.RUNNING)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["profile_snapshot", "feature_set_version", "source_fingerprint"],
                name="unique_feature_computation_input",
            )
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.profile_snapshot_id and self.institution_id:
            if self.profile_snapshot.profile.institution_id != self.institution_id:
                errors["institution"] = "Feature run institution must match the profile."
        if self.profile_snapshot_id and self.customer_id:
            if self.profile_snapshot.profile.customer_id != self.customer_id:
                errors["customer"] = "Feature run customer must match the profile."
        if errors:
            raise ValidationError(errors)


class FeatureValue(UUIDModel, TimeStampedModel):
    run = models.ForeignKey(FeatureComputationRun, on_delete=models.PROTECT, related_name="values")
    definition = models.ForeignKey(
        FeatureDefinition, on_delete=models.PROTECT, related_name="values"
    )
    numeric_value = models.DecimalField(max_digits=20, decimal_places=6, blank=True, null=True)
    boolean_value = models.BooleanField(blank=True, null=True)
    categorical_value = models.CharField(max_length=100, blank=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0"))
    available = models.BooleanField(default=True)
    unavailable_reason = models.CharField(max_length=100, blank=True)
    provenance = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["run", "definition"], name="unique_feature_value")
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if not Decimal("0") <= self.confidence <= Decimal("1"):
            errors["confidence"] = "Confidence must be between zero and one."
        if self.available and not any(
            value is not None and value != ""
            for value in (self.numeric_value, self.boolean_value, self.categorical_value)
        ):
            errors["available"] = "Available feature values must contain a value."
        if not self.available and not self.unavailable_reason:
            errors["unavailable_reason"] = "Unavailable features require a reason."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)
