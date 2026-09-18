from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.ledger.models import Account
from packages.common.models import TimeStampedModel, UUIDModel


class FinancialProfile(UUIDModel, TimeStampedModel):
    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="financial_profiles"
    )
    customer = models.ForeignKey(
        "identity.User", on_delete=models.PROTECT, related_name="financial_profiles"
    )
    current_snapshot = models.ForeignKey(
        "FinancialProfileSnapshot",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="current_for_profiles",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "customer"], name="unique_financial_profile_per_customer"
            )
        ]

    def clean(self) -> None:
        if self.customer_id and self.customer.identity_type != "CUSTOMER":
            raise ValidationError({"customer": "A financial profile must belong to a customer."})

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class FinancialProfileSnapshot(UUIDModel, TimeStampedModel):
    profile = models.ForeignKey(
        FinancialProfile, on_delete=models.PROTECT, related_name="snapshots"
    )
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    computation_version = models.CharField(max_length=50)
    source_fingerprint = models.CharField(max_length=64)
    account_count = models.PositiveIntegerField(default=0)
    covered_account_count = models.PositiveIntegerField(default=0)
    coverage_ratio = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal("0"))
    confidence = models.CharField(max_length=20, default="LOW")
    completeness = models.JSONField(default=dict)
    provenance = models.JSONField(default=dict)
    is_current = models.BooleanField(default=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "profile",
                    "period_start",
                    "period_end",
                    "computation_version",
                    "source_fingerprint",
                ],
                name="unique_profile_snapshot_input",
            )
        ]
        indexes = [models.Index(fields=["profile", "is_current", "period_end"])]

    def clean(self) -> None:
        if self.period_end <= self.period_start:
            raise ValidationError("Profile period end must be after period start.")
        if not Decimal("0") <= self.coverage_ratio <= Decimal("1"):
            raise ValidationError(
                {"coverage_ratio": "Coverage ratio must be between zero and one."}
            )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class AccountSummary(UUIDModel):
    snapshot = models.ForeignKey(
        FinancialProfileSnapshot, on_delete=models.PROTECT, related_name="account_summaries"
    )
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="profile_summaries")
    currency = models.CharField(max_length=3)
    current_balance = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    period_inflows = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    period_outflows = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    entry_count = models.PositiveIntegerField(default=0)
    covered = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["snapshot", "account"], name="unique_snapshot_account_summary"
            )
        ]


class CashFlowSummary(UUIDModel):
    snapshot = models.OneToOneField(
        FinancialProfileSnapshot, on_delete=models.PROTECT, related_name="cash_flow"
    )
    total_inflows = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    total_outflows = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    net_cash_flow = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    transaction_count = models.PositiveIntegerField(default=0)


class IncomeSummary(UUIDModel):
    snapshot = models.OneToOneField(
        FinancialProfileSnapshot, on_delete=models.PROTECT, related_name="income"
    )
    estimated_total = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    observation_count = models.PositiveIntegerField(default=0)
    methodology = models.CharField(max_length=100, default="credit_flow")


class ExpenseSummary(UUIDModel):
    snapshot = models.OneToOneField(
        FinancialProfileSnapshot, on_delete=models.PROTECT, related_name="expenses"
    )
    total = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    observation_count = models.PositiveIntegerField(default=0)
    by_category = models.JSONField(default=dict)


class SavingsSummary(UUIDModel):
    snapshot = models.OneToOneField(
        FinancialProfileSnapshot, on_delete=models.PROTECT, related_name="savings"
    )
    net_savings = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    savings_rate = models.DecimalField(max_digits=7, decimal_places=4, default=Decimal("0"))
    methodology = models.CharField(max_length=100, default="net_cash_flow_ratio")


class ProfileComputationRun(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        REUSED = "REUSED", "Reused"
        FAILED = "FAILED", "Failed"

    profile = models.ForeignKey(
        FinancialProfile, on_delete=models.PROTECT, related_name="computation_runs"
    )
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    computation_version = models.CharField(max_length=50)
    source_fingerprint = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=Status, default=Status.RUNNING, db_index=True)
    snapshot = models.ForeignKey(
        FinancialProfileSnapshot,
        blank=True,
        null=True,
        on_delete=models.PROTECT,
        related_name="computation_runs",
    )
    error_message = models.TextField(blank=True)
