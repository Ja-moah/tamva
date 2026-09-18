from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.identity.models import User
from domains.partner.models import Institution
from packages.common.models import TimeStampedModel, UUIDModel


class PassportSectionCode(models.TextChoices):
    IDENTITY = "IDENTITY", "Identity"
    FINANCIAL_SUMMARY = "FINANCIAL_SUMMARY", "Financial summary"
    INCOME_SUMMARY = "INCOME_SUMMARY", "Income summary"
    CASHFLOW_SUMMARY = "CASHFLOW_SUMMARY", "Cashflow summary"
    SAVINGS_SUMMARY = "SAVINGS_SUMMARY", "Savings summary"
    ACCOUNT_COVERAGE = "ACCOUNT_COVERAGE", "Account coverage"
    PROFILE_COMPLETENESS = "PROFILE_COMPLETENESS", "Profile completeness"
    SELECTED_TRUST_SIGNALS = "SELECTED_TRUST_SIGNALS", "Selected trust signals"
    SELECTED_RISK_SUMMARY = "SELECTED_RISK_SUMMARY", "Selected risk summary"
    NETWORK_SUMMARY = "NETWORK_SUMMARY", "Network summary"


class FinancialPassport(UUIDModel, TimeStampedModel):
    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="financial_passports"
    )
    customer = models.ForeignKey(User, on_delete=models.PROTECT, related_name="financial_passports")
    current_snapshot = models.ForeignKey(
        "PassportSnapshot",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="current_for_passports",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "customer"], name="unique_financial_passport_per_customer"
            )
        ]


class PassportSnapshot(UUIDModel, TimeStampedModel):
    passport = models.ForeignKey(
        FinancialPassport, on_delete=models.PROTECT, related_name="snapshots"
    )
    schema_version = models.CharField(max_length=20)
    source_fingerprint = models.CharField(max_length=64)
    provenance = models.JSONField(default=dict)
    is_current = models.BooleanField(default=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["passport", "schema_version", "source_fingerprint"],
                name="unique_passport_snapshot_input",
            )
        ]
        indexes = [models.Index(fields=["passport", "is_current"])]


class PassportSection(UUIDModel):
    snapshot = models.ForeignKey(
        PassportSnapshot, on_delete=models.PROTECT, related_name="sections"
    )
    code = models.CharField(max_length=30, choices=PassportSectionCode)
    schema_version = models.CharField(max_length=20)
    payload = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["snapshot", "code"], name="unique_passport_section")
        ]


class PassportShare(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        EXPIRED = "EXPIRED", "Expired"
        REVOKED = "REVOKED", "Revoked"

    snapshot = models.ForeignKey(PassportSnapshot, on_delete=models.PROTECT, related_name="shares")
    recipient_institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="received_passport_shares"
    )
    purpose_code = models.CharField(max_length=100)
    allowed_sections = models.JSONField(default=list)
    token_hash = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, choices=Status, default=Status.ACTIVE)
    created_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="passport_shares_created"
    )
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [models.Index(fields=["recipient_institution", "status"])]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if not self.allowed_sections:
            errors["allowed_sections"] = "A share must grant at least one section."
        if self.status == self.Status.REVOKED and not self.revoked_at:
            errors["revoked_at"] = "Revoked shares must have a revoked_at timestamp."
        if self.status != self.Status.REVOKED and self.revoked_at:
            errors["revoked_at"] = "Only revoked shares may have a revoked_at timestamp."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class PassportShareAccess(UUIDModel):
    class Outcome(models.TextChoices):
        SUCCESS = "SUCCESS", "Success"
        DENIED = "DENIED", "Denied"

    share = models.ForeignKey(PassportShare, on_delete=models.PROTECT, related_name="accesses")
    accessor_institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="passport_share_accesses"
    )
    outcome = models.CharField(max_length=20, choices=Outcome)
    reason = models.CharField(max_length=100, blank=True)
    requested_sections = models.JSONField(default=list)
    accessed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["accessed_at"]
