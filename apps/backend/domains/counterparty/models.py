from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.identity.models import User
from domains.partner.models import Institution
from packages.common.models import TimeStampedModel, UUIDModel


class CounterpartyProfile(UUIDModel, TimeStampedModel):
    """An institution-wide view of a counterparty, aggregated across every
    customer who has transacted with it. Derived entirely from
    `normalisation.CanonicalTransaction`; no external merchant/beneficiary
    reputation data is used."""

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="counterparty_profiles"
    )
    counterparty_reference = models.CharField(max_length=255)
    counterparty_name = models.CharField(max_length=255, blank=True)
    first_seen_at = models.DateTimeField()
    last_seen_at = models.DateTimeField()
    transaction_count = models.PositiveIntegerField(default=0)
    total_value = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "counterparty_reference"],
                name="unique_counterparty_profile",
            )
        ]


class CustomerCounterpartyRelationship(UUIDModel, TimeStampedModel):
    """The customer-specific relationship to a counterparty. This is the
    primary aggregate behind "first-time counterparty", "frequent
    counterparty", and concentration signals."""

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="counterparty_relationships"
    )
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="counterparty_relationships"
    )
    counterparty = models.ForeignKey(
        CounterpartyProfile, on_delete=models.PROTECT, related_name="customer_relationships"
    )
    first_seen_at = models.DateTimeField()
    last_seen_at = models.DateTimeField()
    transaction_count = models.PositiveIntegerField(default=0)
    inbound_count = models.PositiveIntegerField(default=0)
    outbound_count = models.PositiveIntegerField(default=0)
    total_value = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    average_value = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "counterparty"], name="unique_customer_counterparty"
            )
        ]
        indexes = [models.Index(fields=["institution", "customer"])]

    def clean(self) -> None:
        if (
            self.counterparty_id
            and self.institution_id
            and self.counterparty.institution_id != self.institution_id
        ):
            raise ValidationError(
                {"counterparty": "Counterparty institution must match the relationship."}
            )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class CounterpartyObservation(UUIDModel):
    """Append-only evidence trail behind a relationship, one row per
    contributing canonical transaction."""

    class Direction(models.TextChoices):
        INBOUND = "INBOUND", "Inbound"
        OUTBOUND = "OUTBOUND", "Outbound"

    relationship = models.ForeignKey(
        CustomerCounterpartyRelationship, on_delete=models.PROTECT, related_name="observations"
    )
    direction = models.CharField(max_length=20, choices=Direction)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    occurred_at = models.DateTimeField()
    provenance_type = models.CharField(max_length=100)
    provenance_id = models.UUIDField()

    class Meta:
        ordering = ["occurred_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["relationship", "provenance_type", "provenance_id"],
                name="unique_counterparty_observation",
            )
        ]
