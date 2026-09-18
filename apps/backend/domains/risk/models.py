from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.feature.models import FeatureComputationRun
from domains.identity.models import User
from domains.modeling.models import ModelEvaluationRun, ModelVersion
from domains.partner.models import Institution
from domains.rules.models import RuleEvaluationRun, RuleSetVersion
from packages.common.models import TimeStampedModel, UUIDModel

from .policy import RiskPolicyConfig


class RiskPolicy(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["code"]


class RiskPolicyVersion(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        RETIRED = "RETIRED", "Retired"

    policy = models.ForeignKey(RiskPolicy, on_delete=models.PROTECT, related_name="versions")
    version = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status, default=Status.DRAFT)
    configuration = models.JSONField(default=dict)
    activated_at = models.DateTimeField(blank=True, null=True)
    retired_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["policy", "version"], name="unique_risk_policy_version")
        ]

    def clean(self) -> None:
        RiskPolicyConfig.from_dict(self.configuration)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class RiskEvaluationRun(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"
        SKIPPED = "SKIPPED", "Skipped"

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="risk_evaluation_runs"
    )
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="risk_evaluation_runs"
    )
    feature_run = models.ForeignKey(
        FeatureComputationRun, on_delete=models.PROTECT, related_name="risk_evaluation_runs"
    )
    rule_run = models.ForeignKey(
        RuleEvaluationRun,
        on_delete=models.PROTECT,
        related_name="risk_evaluation_runs",
        blank=True,
        null=True,
    )
    model_run = models.ForeignKey(
        ModelEvaluationRun,
        on_delete=models.PROTECT,
        related_name="risk_evaluation_runs",
        blank=True,
        null=True,
    )
    policy_version = models.ForeignKey(
        RiskPolicyVersion, on_delete=models.PROTECT, related_name="evaluation_runs"
    )
    source_fingerprint = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=Status, default=Status.RUNNING)
    failure_reason = models.CharField(max_length=200, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "feature_run",
                    "rule_run",
                    "model_run",
                    "policy_version",
                    "source_fingerprint",
                ],
                name="unique_risk_evaluation_input",
            )
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.feature_run_id and self.institution_id:
            if self.feature_run.institution_id != self.institution_id:
                errors["institution"] = "Risk run institution must match the feature run."
        if self.feature_run_id and self.customer_id:
            if self.feature_run.customer_id != self.customer_id:
                errors["customer"] = "Risk run customer must match the feature run."
        if self.rule_run is not None and self.feature_run_id:
            if self.rule_run.feature_run_id != self.feature_run_id:
                errors["rule_run"] = "Rule evaluation must share the same feature run."
        if self.model_run is not None and self.feature_run_id:
            if self.model_run.feature_run_id != self.feature_run_id:
                errors["model_run"] = "Model evaluation must share the same feature run."
        if errors:
            raise ValidationError(errors)


class RiskEvent(UUIDModel, TimeStampedModel):
    class Decision(models.TextChoices):
        ALLOW = "ALLOW", "Allow"
        CHALLENGE = "CHALLENGE", "Challenge"
        HOLD = "HOLD", "Hold"
        BLOCK = "BLOCK", "Block"

    run = models.OneToOneField(RiskEvaluationRun, on_delete=models.PROTECT, related_name="event")
    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="risk_events"
    )
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name="risk_events")
    feature_run = models.ForeignKey(
        FeatureComputationRun, on_delete=models.PROTECT, related_name="risk_events"
    )
    rule_run = models.ForeignKey(
        RuleEvaluationRun,
        on_delete=models.PROTECT,
        related_name="risk_events",
        blank=True,
        null=True,
    )
    model_run = models.ForeignKey(
        ModelEvaluationRun,
        on_delete=models.PROTECT,
        related_name="risk_events",
        blank=True,
        null=True,
    )
    policy_version = models.ForeignKey(
        RiskPolicyVersion, on_delete=models.PROTECT, related_name="events"
    )
    ruleset_version = models.ForeignKey(
        RuleSetVersion,
        on_delete=models.PROTECT,
        related_name="risk_events",
        blank=True,
        null=True,
    )
    model_version = models.ForeignKey(
        ModelVersion,
        on_delete=models.PROTECT,
        related_name="risk_events",
        blank=True,
        null=True,
    )
    # Canonical risk score contract: Decimal 0-1000, higher = higher risk.
    score = models.DecimalField(max_digits=9, decimal_places=4)
    decision = models.CharField(max_length=20, choices=Decision)
    confidence = models.DecimalField(max_digits=5, decimal_places=4)
    evaluated_at = models.DateTimeField()
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [models.Index(fields=["institution", "evaluated_at"])]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if not (0 <= self.score <= 1000):
            errors["score"] = "Score must be between 0 and 1000."
        if not (0 <= self.confidence <= 1):
            errors["confidence"] = "Confidence must be between zero and one."
        if (
            self.run_id
            and self.policy_version_id
            and self.run.policy_version_id != self.policy_version_id
        ):
            errors["policy_version"] = "Event policy version must match the evaluation run."
        if self.run_id and self.feature_run_id and self.run.feature_run_id != self.feature_run_id:
            errors["feature_run"] = "Event feature run must match the evaluation run."
        if self.run_id and self.run.rule_run_id != self.rule_run_id:
            errors["rule_run"] = "Event rule run must match the evaluation run."
        if self.run_id and self.run.model_run_id != self.model_run_id:
            errors["model_run"] = "Event model run must match the evaluation run."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class RiskReason(UUIDModel):
    class Source(models.TextChoices):
        RULE = "RULE", "Rule"
        MODEL = "MODEL", "Model"
        POLICY = "POLICY", "Policy"
        EVIDENCE = "EVIDENCE", "Evidence"

    event = models.ForeignKey(RiskEvent, on_delete=models.PROTECT, related_name="reasons")
    ordinal = models.PositiveIntegerField(default=0)
    code = models.CharField(max_length=100)
    source = models.CharField(max_length=20, choices=Source)
    severity = models.CharField(max_length=30, blank=True)
    detail = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["ordinal"]
