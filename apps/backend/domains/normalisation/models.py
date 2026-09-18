from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.connector.models import RawEvent
from packages.common.models import TimeStampedModel, UUIDModel


class CanonicalTransaction(UUIDModel, TimeStampedModel):
    class Direction(models.TextChoices):
        CREDIT = "CREDIT", "Credit"
        DEBIT = "DEBIT", "Debit"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        POSTED = "POSTED", "Posted"
        REVERSED = "REVERSED", "Reversed"
        FAILED = "FAILED", "Failed"

    raw_event = models.OneToOneField(
        RawEvent, on_delete=models.PROTECT, related_name="canonical_transaction"
    )
    institution = models.ForeignKey(
        "partner.Institution", on_delete=models.PROTECT, related_name="canonical_transactions"
    )
    customer = models.ForeignKey(
        "identity.User", on_delete=models.PROTECT, related_name="canonical_transactions"
    )
    connection = models.ForeignKey(
        "connector.InstitutionConnection",
        on_delete=models.PROTECT,
        related_name="canonical_transactions",
    )
    source_event_id = models.CharField(max_length=255)
    source_account_reference = models.CharField(max_length=255)
    direction = models.CharField(max_length=10, choices=Direction)
    transaction_type = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=Status, db_index=True)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    currency = models.CharField(max_length=3)
    occurred_at = models.DateTimeField()
    posted_at = models.DateTimeField(blank=True, null=True)
    counterparty_name = models.CharField(max_length=255, blank=True)
    counterparty_reference = models.CharField(max_length=255, blank=True)
    channel = models.CharField(max_length=100, blank=True)
    merchant_category = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    source_provenance = models.JSONField(default=dict)
    normalisation_version = models.CharField(max_length=50)

    class Meta:
        indexes = [
            models.Index(fields=["institution", "occurred_at"]),
            models.Index(fields=["connection", "source_event_id"]),
            models.Index(fields=["institution", "status"]),
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.raw_event_id and self.connection_id:
            if self.raw_event.connection_id != self.connection_id:
                errors["connection"] = "Transaction connection must match its raw event."
        if self.connection_id and self.institution_id:
            if self.connection.institution_id != self.institution_id:
                errors["institution"] = "Transaction institution must match its connection."
        if self.connection_id and self.customer_id:
            if self.connection.customer_id != self.customer_id:
                errors["customer"] = "Transaction customer must match its connection."
        if self.raw_event_id and self.source_event_id:
            if self.raw_event.source_event_id != self.source_event_id:
                errors["source_event_id"] = "Source event identity cannot be rewritten."
        if self.amount is not None and self.amount <= Decimal("0"):
            errors["amount"] = "Canonical transaction amount must be positive."
        if self.currency and len(self.currency) != 3:
            errors["currency"] = "Currency must be an ISO 4217 three-letter code."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if not self._state.adding and self.pk:
            original = (
                type(self)
                .objects.filter(pk=self.pk)
                .values(
                    "raw_event_id",
                    "institution_id",
                    "customer_id",
                    "connection_id",
                    "source_event_id",
                    "source_provenance",
                    "normalisation_version",
                )
                .first()
            )
            immutable_fields = (
                "raw_event_id",
                "institution_id",
                "customer_id",
                "connection_id",
                "source_event_id",
                "source_provenance",
                "normalisation_version",
            )
            original_data = dict(original) if original else None
            if original_data and any(
                original_data[field] != getattr(self, field) for field in immutable_fields
            ):
                raise ValidationError("Canonical source provenance is immutable.")
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.source_event_id}:{self.amount} {self.currency}"
