from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.feature.models import FeatureComputationRun, FeatureDefinition
from domains.identity.models import User
from domains.partner.models import Institution
from packages.common.models import TimeStampedModel, UUIDModel


class RuleDefinition(UUIDModel, TimeStampedModel):
    class Operator(models.TextChoices):
        EQ = "EQ", "Equals"
        NE = "NE", "Not equals"
        GT = "GT", "Greater than"
        GTE = "GTE", "Greater than or equal"
        LT = "LT", "Less than"
        LTE = "LTE", "Less than or equal"
        BETWEEN = "BETWEEN", "Between"
        IN = "IN", "In"
        NOT_IN = "NOT_IN", "Not in"
        EXISTS = "EXISTS", "Exists"
        NOT_EXISTS = "NOT_EXISTS", "Not exists"

    class MissingPolicy(models.TextChoices):
        SKIP = "SKIP", "Skip"
        FAIL_CLOSED = "FAIL_CLOSED", "Fail closed"
        FAIL_OPEN = "FAIL_OPEN", "Fail open"

    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    feature = models.ForeignKey(FeatureDefinition, on_delete=models.PROTECT, related_name="rules")
    operator = models.CharField(max_length=20, choices=Operator)
    threshold = models.JSONField(default=dict)
    severity = models.CharField(max_length=30, default="INFO")
    reason_code = models.CharField(max_length=100)
    version = models.CharField(max_length=50, default="1")
    missing_policy = models.CharField(
        max_length=20, choices=MissingPolicy, default=MissingPolicy.SKIP
    )
    active = models.BooleanField(default=True, db_index=True)


class RuleSetVersion(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        RETIRED = "RETIRED", "Retired"

    code = models.CharField(max_length=100)
    version = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status, default=Status.DRAFT)
    activated_at = models.DateTimeField(blank=True, null=True)
    retired_at = models.DateTimeField(blank=True, null=True)
    rules: models.ManyToManyField[RuleDefinition, RuleSetMembership] = models.ManyToManyField(
        RuleDefinition, through="RuleSetMembership"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["code", "version"], name="unique_rule_set_version")
        ]


class RuleSetMembership(UUIDModel):
    rule_set = models.ForeignKey(RuleSetVersion, on_delete=models.PROTECT)
    rule = models.ForeignKey(RuleDefinition, on_delete=models.PROTECT)
    ordinal = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordinal", "rule__code"]
        constraints = [
            models.UniqueConstraint(fields=["rule_set", "rule"], name="unique_rule_set_rule")
        ]


class RuleEvaluationRun(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        REUSED = "REUSED", "Reused"

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="rule_evaluation_runs"
    )
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="rule_evaluation_runs"
    )
    feature_run = models.ForeignKey(
        FeatureComputationRun, on_delete=models.PROTECT, related_name="rule_runs"
    )
    rule_set_version = models.ForeignKey(
        RuleSetVersion, on_delete=models.PROTECT, related_name="evaluation_runs"
    )
    source_fingerprint = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=Status, default=Status.RUNNING)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["feature_run", "rule_set_version", "source_fingerprint"],
                name="unique_rule_evaluation_input",
            )
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.feature_run_id and self.institution_id:
            if self.feature_run.institution_id != self.institution_id:
                errors["institution"] = "Rule run institution must match the feature run."
        if self.feature_run_id and self.customer_id:
            if self.feature_run.customer_id != self.customer_id:
                errors["customer"] = "Rule run customer must match the feature run."
        if errors:
            raise ValidationError(errors)


class RuleEvaluationResult(UUIDModel, TimeStampedModel):
    run = models.ForeignKey(RuleEvaluationRun, on_delete=models.PROTECT, related_name="results")
    rule = models.ForeignKey(RuleDefinition, on_delete=models.PROTECT, related_name="results")
    matched = models.BooleanField(blank=True, null=True)
    skipped = models.BooleanField(default=False)
    observed_value = models.JSONField(blank=True, null=True)
    expected_value = models.JSONField(default=dict, blank=True)
    reason_code = models.CharField(max_length=100)
    severity = models.CharField(max_length=30)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["run", "rule"], name="unique_rule_evaluation_result")
        ]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.skipped and self.matched is not None:
            raise ValidationError("Skipped rule results cannot have a match state.")
        super().save(*args, **kwargs)


def decimal_value(value: Any) -> Decimal:
    return Decimal(str(value))
