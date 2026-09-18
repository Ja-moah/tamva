from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.feature.models import FeatureComputationRun, FeatureDefinition
from domains.identity.models import User
from domains.partner.models import Institution
from packages.common.models import TimeStampedModel, UUIDModel


class ModelDefinition(UUIDModel, TimeStampedModel):
    class OwnerScope(models.TextChoices):
        PLATFORM = "PLATFORM", "Platform"
        INSTITUTION = "INSTITUTION", "Institution"

    class ScoreDirection(models.TextChoices):
        HIGHER_IS_RISKIER = "HIGHER_IS_RISKIER", "Higher is riskier"
        HIGHER_IS_SAFER = "HIGHER_IS_SAFER", "Higher is safer"

    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    model_type = models.CharField(max_length=50)
    owner_scope = models.CharField(max_length=20, choices=OwnerScope, default=OwnerScope.PLATFORM)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.PROTECT,
        related_name="model_definitions",
        blank=True,
        null=True,
    )
    score_min = models.DecimalField(max_digits=10, decimal_places=4)
    score_max = models.DecimalField(max_digits=10, decimal_places=4)
    score_direction = models.CharField(max_length=20, choices=ScoreDirection)
    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["code"]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.owner_scope == self.OwnerScope.INSTITUTION and not self.institution_id:
            errors["institution"] = "Institution-scoped models require an institution."
        if self.owner_scope == self.OwnerScope.PLATFORM and self.institution_id:
            errors["institution"] = "Platform-scoped models must not have an institution."
        if self.score_min is not None and self.score_max is not None:
            if self.score_min >= self.score_max:
                errors["score_max"] = "score_max must be greater than score_min."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class ModelVersion(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        RETIRED = "RETIRED", "Retired"

    model_definition = models.ForeignKey(
        ModelDefinition, on_delete=models.PROTECT, related_name="versions"
    )
    version = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status, default=Status.DRAFT)
    provider_code = models.CharField(max_length=100)
    input_contract_version = models.CharField(max_length=50)
    output_contract_version = models.CharField(max_length=50)
    artifact_reference = models.JSONField(default=dict, blank=True)
    activated_at = models.DateTimeField(blank=True, null=True)
    retired_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["model_definition", "version"], name="unique_model_version"
            )
        ]


class ModelFeatureBinding(UUIDModel):
    class OnMissing(models.TextChoices):
        OMIT = "OMIT", "Omit from input"
        DEFAULT = "DEFAULT", "Use configured default"
        FAIL = "FAIL", "Fail the evaluation"

    model_version = models.ForeignKey(
        ModelVersion, on_delete=models.PROTECT, related_name="feature_bindings"
    )
    feature = models.ForeignKey(
        FeatureDefinition, on_delete=models.PROTECT, related_name="model_bindings"
    )
    required = models.BooleanField(default=True)
    expected_type = models.CharField(max_length=20, choices=FeatureDefinition.ValueType)
    on_missing = models.CharField(max_length=20, choices=OnMissing, default=OnMissing.OMIT)
    default_value = models.JSONField(blank=True, null=True)
    transformation = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["feature__code"]
        constraints = [
            models.UniqueConstraint(
                fields=["model_version", "feature"], name="unique_model_feature_binding"
            )
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.feature_id and self.expected_type and self.expected_type != self.feature.value_type:
            errors["expected_type"] = "expected_type must match the bound feature's value_type."
        if self.on_missing == self.OnMissing.DEFAULT and self.default_value is None:
            errors["default_value"] = "on_missing=DEFAULT requires a default_value."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class ModelEvaluationRun(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RUNNING = "RUNNING", "Running"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        FAILED = "FAILED", "Failed"
        SKIPPED = "SKIPPED", "Skipped"

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="model_evaluation_runs"
    )
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="model_evaluation_runs"
    )
    feature_run = models.ForeignKey(
        FeatureComputationRun, on_delete=models.PROTECT, related_name="model_evaluation_runs"
    )
    model_version = models.ForeignKey(
        ModelVersion, on_delete=models.PROTECT, related_name="evaluation_runs"
    )
    source_fingerprint = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    failure_reason = models.CharField(max_length=200, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["feature_run", "model_version", "source_fingerprint"],
                name="unique_model_evaluation_input",
            )
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.feature_run_id and self.institution_id:
            if self.feature_run.institution_id != self.institution_id:
                errors["institution"] = "Model run institution must match the feature run."
        if self.feature_run_id and self.customer_id:
            if self.feature_run.customer_id != self.customer_id:
                errors["customer"] = "Model run customer must match the feature run."
        if errors:
            raise ValidationError(errors)


class ModelEvaluationResult(UUIDModel, TimeStampedModel):
    run = models.OneToOneField(ModelEvaluationRun, on_delete=models.PROTECT, related_name="result")
    model_version = models.ForeignKey(
        ModelVersion, on_delete=models.PROTECT, related_name="results"
    )
    score = models.DecimalField(max_digits=10, decimal_places=4)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    output_code = models.CharField(max_length=100, blank=True)
    contributions = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if (
            self.run_id
            and self.model_version_id
            and self.run.model_version_id != self.model_version_id
        ):
            errors["model_version"] = "Result model version must match the evaluation run."
        definition = self.model_version.model_definition if self.model_version_id else None
        if definition is not None and self.score is not None:
            if not (definition.score_min <= self.score <= definition.score_max):
                errors["score"] = "Score is outside the model definition's documented bounds."
        if self.confidence is not None and not (0 <= self.confidence <= 1):
            errors["confidence"] = "Confidence must be between zero and one."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)
