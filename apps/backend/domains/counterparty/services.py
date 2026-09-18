from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from django.db import transaction

from domains.identity.models import User
from domains.normalisation.models import CanonicalTransaction
from domains.partner.models import Institution

from .models import (
    CounterpartyObservation,
    CounterpartyProfile,
    CustomerCounterpartyRelationship,
)


@transaction.atomic
def record_counterparty_observation(
    *,
    institution: Institution,
    customer: User,
    counterparty_reference: str,
    counterparty_name: str,
    direction: str,
    amount: Decimal,
    occurred_at: datetime,
    provenance_type: str,
    provenance_id: UUID,
) -> CustomerCounterpartyRelationship:
    profile, _ = CounterpartyProfile.objects.get_or_create(
        institution=institution,
        counterparty_reference=counterparty_reference,
        defaults={
            "counterparty_name": counterparty_name,
            "first_seen_at": occurred_at,
            "last_seen_at": occurred_at,
        },
    )
    relationship, _ = CustomerCounterpartyRelationship.objects.get_or_create(
        institution=institution,
        customer=customer,
        counterparty=profile,
        defaults={"first_seen_at": occurred_at, "last_seen_at": occurred_at},
    )
    _, observation_created = CounterpartyObservation.objects.get_or_create(
        relationship=relationship,
        provenance_type=provenance_type,
        provenance_id=provenance_id,
        defaults={"direction": direction, "amount": amount, "occurred_at": occurred_at},
    )
    if observation_created:
        relationship.transaction_count += 1
        if direction == CounterpartyObservation.Direction.INBOUND:
            relationship.inbound_count += 1
        else:
            relationship.outbound_count += 1
        relationship.total_value += amount
        relationship.average_value = (
            relationship.total_value / relationship.transaction_count
        ).quantize(Decimal("0.01"))
        relationship.first_seen_at = min(relationship.first_seen_at, occurred_at)
        relationship.last_seen_at = max(relationship.last_seen_at, occurred_at)
        relationship.save(
            update_fields=[
                "transaction_count",
                "inbound_count",
                "outbound_count",
                "total_value",
                "average_value",
                "first_seen_at",
                "last_seen_at",
                "updated_at",
            ]
        )

        profile.transaction_count += 1
        profile.total_value += amount
        profile.first_seen_at = min(profile.first_seen_at, occurred_at)
        profile.last_seen_at = max(profile.last_seen_at, occurred_at)
        profile.save(
            update_fields=[
                "transaction_count",
                "total_value",
                "first_seen_at",
                "last_seen_at",
                "updated_at",
            ]
        )
    return relationship


def sync_customer_counterparties(
    *, institution: Institution, customer: User
) -> list[CustomerCounterpartyRelationship]:
    """Derive/refresh every counterparty relationship from this customer's
    canonical transactions at this institution. Safe to call repeatedly:
    each contributing transaction is idempotent via CounterpartyObservation.
    """
    transactions = (
        CanonicalTransaction.objects.filter(institution=institution, customer=customer)
        .exclude(counterparty_reference="")
        .order_by("occurred_at")
    )
    relationships: dict[UUID, CustomerCounterpartyRelationship] = {}
    for txn in transactions:
        direction = (
            CounterpartyObservation.Direction.INBOUND
            if txn.direction == CanonicalTransaction.Direction.CREDIT
            else CounterpartyObservation.Direction.OUTBOUND
        )
        relationship = record_counterparty_observation(
            institution=institution,
            customer=customer,
            counterparty_reference=txn.counterparty_reference,
            counterparty_name=txn.counterparty_name,
            direction=direction,
            amount=txn.amount,
            occurred_at=txn.occurred_at,
            provenance_type="normalisation.CanonicalTransaction",
            provenance_id=txn.id,
        )
        relationships[relationship.id] = relationship
    return list(relationships.values())
