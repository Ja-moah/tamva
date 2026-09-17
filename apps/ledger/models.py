from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from apps.normalisation.models import CanonicalTransaction
from packages.common.models import TimeStampedModel, UUIDModel


class Account(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CLOSED = "CLOSED", "Closed"

    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="ledger_accounts"
    )
    customer = models.ForeignKey(
        "identity.User", on_delete=models.PROTECT, related_name="ledger_accounts"
    )
    connection = models.ForeignKey(
        "connector.InstitutionConnection", on_delete=models.PROTECT, related_name="ledger_accounts"
    )
    source_account_reference = models.CharField(max_length=255)
    currency = models.CharField(max_length=3)
    status = models.CharField(max_length=20, choices=Status, default=Status.ACTIVE, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "connection", "source_account_reference", "currency"],
                name="unique_ledger_account_source_reference",
            )
        ]
        indexes = [models.Index(fields=["institution", "customer", "status"])]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.connection_id and self.institution_id:
            if self.connection.institution_id != self.institution_id:
                errors["institution"] = "Account institution must match its connection."
        if self.connection_id and self.customer_id:
            if self.connection.customer_id != self.customer_id:
                errors["customer"] = "Account customer must match its connection."
        if self.currency and len(self.currency) != 3:
            errors["currency"] = "Currency must be an ISO 4217 three-letter code."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class LedgerPosting(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        POSTED = "POSTED", "Posted"
        REVERSED = "REVERSED", "Reversed"
        FAILED = "FAILED", "Failed"

    transaction = models.OneToOneField(
        CanonicalTransaction, on_delete=models.PROTECT, related_name="ledger_posting"
    )
    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="ledger_postings"
    )
    status = models.CharField(max_length=20, choices=Status, default=Status.POSTED, db_index=True)
    posted_at = models.DateTimeField()
    reversal_of = models.ForeignKey(
        "self", blank=True, null=True, on_delete=models.PROTECT, related_name="reversals"
    )
    metadata = models.JSONField(default=dict, blank=True)

    def clean(self) -> None:
        if self.transaction_id and self.institution_id:
            if self.transaction.institution_id != self.institution_id:
                raise ValidationError("Posting institution must match the transaction.")

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class LedgerEntry(UUIDModel):
    class Direction(models.TextChoices):
        CREDIT = "CREDIT", "Credit"
        DEBIT = "DEBIT", "Debit"

    class EntryType(models.TextChoices):
        POSTING = "POSTING", "Posting"
        REVERSAL = "REVERSAL", "Reversal"
        CORRECTION = "CORRECTION", "Correction"

    posting = models.ForeignKey(LedgerPosting, on_delete=models.PROTECT, related_name="entries")
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="entries")
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    currency = models.CharField(max_length=3)
    direction = models.CharField(max_length=10, choices=Direction)
    entry_type = models.CharField(max_length=20, choices=EntryType, default=EntryType.POSTING)
    effective_at = models.DateTimeField()
    compensates = models.ForeignKey(
        "self", blank=True, null=True, on_delete=models.PROTECT, related_name="compensating_entries"
    )
    metadata = models.JSONField(default=dict, blank=True)

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.amount is not None and self.amount <= Decimal("0"):
            errors["amount"] = "Ledger entry amount must be positive."
        if self.account_id and self.currency != self.account.currency:
            errors["currency"] = "Ledger entry currency must match its account."
        if self.posting_id and self.account.institution_id != self.posting.institution_id:
            errors["account"] = "Ledger entry account must match its posting institution."
        if errors:
            raise ValidationError(errors)

    @property
    def signed_amount(self) -> Decimal:
        return self.amount if self.direction == self.Direction.CREDIT else -self.amount

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self._state.adding and self.pk:
            original = type(self).objects.filter(pk=self.pk).values(
                "posting_id",
                "account_id",
                "amount",
                "currency",
                "direction",
                "entry_type",
                "effective_at",
            ).first()
            fields = (
                "posting_id",
                "account_id",
                "amount",
                "currency",
                "direction",
                "entry_type",
                "effective_at",
            )
            if original and any(original[field] != getattr(self, field) for field in fields):
                raise ValidationError("Ledger entries are append-only and immutable.")
        self.full_clean()
        super().save(*args, **kwargs)


class ReconciliationRun(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        MISMATCHED = "MISMATCHED", "Mismatched"

    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="reconciliation_runs"
    )
    connection = models.ForeignKey(
        "connector.InstitutionConnection",
        on_delete=models.PROTECT,
        related_name="reconciliation_runs",
    )
    status = models.CharField(max_length=20, choices=Status, default=Status.RUNNING, db_index=True)
    started_at = models.DateTimeField()
    completed_at = models.DateTimeField(blank=True, null=True)
    matched_count = models.PositiveIntegerField(default=0)
    mismatch_count = models.PositiveIntegerField(default=0)


class ReconciliationItem(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        MATCHED = "MATCHED", "Matched"
        MISMATCH = "MISMATCH", "Mismatch"
        UNRESOLVED = "UNRESOLVED", "Unresolved"

    run = models.ForeignKey(ReconciliationRun, on_delete=models.PROTECT, related_name="items")
    transaction = models.ForeignKey(
        CanonicalTransaction,
        blank=True,
        null=True,
        on_delete=models.PROTECT,
        related_name="reconciliation_items",
    )
    source_event_id = models.CharField(max_length=255)
    expected_amount = models.DecimalField(max_digits=20, decimal_places=2)
    ledger_amount = models.DecimalField(max_digits=20, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=3)
    status = models.CharField(
        max_length=20, choices=Status, default=Status.UNRESOLVED, db_index=True
    )
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["run", "source_event_id"], name="unique_reconciliation_source_event"
            )
        ]