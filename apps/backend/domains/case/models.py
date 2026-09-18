from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.identity.models import User
from domains.partner.models import Institution
from domains.risk.models import RiskEvent
from packages.common.models import TimeStampedModel, UUIDModel

from .policy import CaseOpeningConfig


class CaseOpeningPolicy(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["code"]


class CaseOpeningPolicyVersion(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        RETIRED = "RETIRED", "Retired"

    policy = models.ForeignKey(CaseOpeningPolicy, on_delete=models.PROTECT, related_name="versions")
    version = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status, default=Status.DRAFT)
    configuration = models.JSONField(default=dict)
    activated_at = models.DateTimeField(blank=True, null=True)
    retired_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["policy", "version"], name="unique_case_opening_policy_version"
            )
        ]

    def clean(self) -> None:
        CaseOpeningConfig.from_dict(self.configuration)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class Case(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        TRIAGED = "TRIAGED", "Triaged"
        INVESTIGATING = "INVESTIGATING", "Investigating"
        ACTIONED = "ACTIONED", "Actioned"
        RESOLVED = "RESOLVED", "Resolved"

    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Source(models.TextChoices):
        AUTOMATIC = "AUTOMATIC", "Automatic"
        MANUAL = "MANUAL", "Manual"

    reference = models.CharField(max_length=32, unique=True, blank=True)
    institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name="cases")
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name="cases")
    case_type = models.CharField(max_length=100)
    priority = models.CharField(max_length=20, choices=Priority)
    status = models.CharField(max_length=20, choices=Status, default=Status.OPEN)
    source = models.CharField(max_length=20, choices=Source)
    opening_policy_version = models.ForeignKey(
        CaseOpeningPolicyVersion,
        on_delete=models.PROTECT,
        related_name="opened_cases",
        blank=True,
        null=True,
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="cases_created",
        blank=True,
        null=True,
    )
    current_assignee = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="assigned_cases",
        blank=True,
        null=True,
    )
    opened_at = models.DateTimeField()
    closed_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["institution", "opened_at"]),
            models.Index(fields=["institution", "status"]),
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.status == self.Status.RESOLVED and not self.closed_at:
            errors["closed_at"] = "Resolved cases must have a closed_at timestamp."
        if self.status != self.Status.RESOLVED and self.closed_at:
            errors["closed_at"] = "Only resolved cases may have a closed_at timestamp."
        if self.source == self.Source.MANUAL and not self.created_by_id:
            errors["created_by"] = "Manually opened cases require created_by."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self.reference:
            self.reference = f"CASE-{self.id.hex[:12].upper()}"
        super().save(*args, **kwargs)


class CaseRiskEvent(UUIDModel):
    case = models.ForeignKey(Case, on_delete=models.PROTECT, related_name="risk_events")
    risk_event = models.ForeignKey(RiskEvent, on_delete=models.PROTECT, related_name="cases")
    linked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["case", "risk_event"], name="unique_case_risk_event")
        ]


class CaseAssignment(UUIDModel):
    case = models.ForeignKey(Case, on_delete=models.PROTECT, related_name="assignments")
    assignee = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="case_assignments",
        blank=True,
        null=True,
    )
    assigned_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="assignments_made")
    note = models.CharField(max_length=500, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["assigned_at"]


class CaseStatusEvent(UUIDModel):
    case = models.ForeignKey(Case, on_delete=models.PROTECT, related_name="status_events")
    previous_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    actor = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="case_status_events",
        blank=True,
        null=True,
    )
    note = models.CharField(max_length=500, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["occurred_at"]


class CaseNote(UUIDModel):
    case = models.ForeignKey(Case, on_delete=models.PROTECT, related_name="notes")
    author = models.ForeignKey(User, on_delete=models.PROTECT, related_name="case_notes")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class CaseAction(UUIDModel):
    class ActionType(models.TextChoices):
        REQUEST_INFORMATION = "REQUEST_INFORMATION", "Request information"
        MARK_REVIEWED = "MARK_REVIEWED", "Mark reviewed"
        ESCALATE = "ESCALATE", "Escalate"
        PLACE_HOLD = "PLACE_HOLD", "Place hold"
        RELEASE_HOLD = "RELEASE_HOLD", "Release hold"
        RECOMMEND_BLOCK = "RECOMMEND_BLOCK", "Recommend block"
        RECOMMEND_ALLOW = "RECOMMEND_ALLOW", "Recommend allow"
        OTHER = "OTHER", "Other"

    case = models.ForeignKey(Case, on_delete=models.PROTECT, related_name="actions")
    action_type = models.CharField(max_length=30, choices=ActionType)
    actor = models.ForeignKey(User, on_delete=models.PROTECT, related_name="case_actions")
    detail = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class CaseResolution(UUIDModel):
    class Outcome(models.TextChoices):
        CONFIRMED_RISK = "CONFIRMED_RISK", "Confirmed risk"
        CLEARED = "CLEARED", "Cleared"
        FALSE_POSITIVE = "FALSE_POSITIVE", "False positive"
        CUSTOMER_VERIFIED = "CUSTOMER_VERIFIED", "Customer verified"
        POLICY_EXCEPTION = "POLICY_EXCEPTION", "Policy exception"
        OTHER = "OTHER", "Other"

    case = models.OneToOneField(Case, on_delete=models.PROTECT, related_name="resolution")
    outcome = models.CharField(max_length=30, choices=Outcome)
    reason = models.TextField()
    resolved_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="case_resolutions")
    resolved_at = models.DateTimeField(auto_now_add=True)
