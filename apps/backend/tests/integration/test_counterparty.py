from decimal import Decimal

import pytest

from domains.counterparty.models import (
    CounterpartyObservation,
    CounterpartyProfile,
    CustomerCounterpartyRelationship,
)
from domains.counterparty.services import sync_customer_counterparties
from domains.ledger.services import post_transaction
from tests.integration.test_ledger import canonical_transaction


def post(context, *, source_event_id, **overrides):
    txn = canonical_transaction(context, source_event_id=source_event_id, **overrides)
    post_transaction(transaction_id=txn.id, institution=context[1])
    return txn


@pytest.mark.integration
@pytest.mark.django_db
def test_first_transaction_creates_relationship(normalisation_context):
    txn = post(normalisation_context, source_event_id="cp-1", counterparty_reference="cp-alpha")

    relationships = sync_customer_counterparties(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    assert len(relationships) == 1
    relationship = relationships[0]
    assert relationship.counterparty.counterparty_reference == "cp-alpha"
    assert relationship.transaction_count == 1
    assert relationship.total_value == txn.amount
    assert relationship.inbound_count == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_repeat_counterparty_aggregates_relationship(normalisation_context):
    post(
        normalisation_context,
        source_event_id="cp-2a",
        counterparty_reference="cp-beta",
        amount="100.00",
    )
    post(
        normalisation_context,
        source_event_id="cp-2b",
        counterparty_reference="cp-beta",
        amount="50.00",
    )

    relationships = sync_customer_counterparties(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    assert len(relationships) == 1
    relationship = relationships[0]
    assert relationship.transaction_count == 2
    assert relationship.total_value == Decimal("150.00")
    assert relationship.average_value == Decimal("75.00")


@pytest.mark.integration
@pytest.mark.django_db
def test_sync_is_idempotent(normalisation_context):
    post(normalisation_context, source_event_id="cp-3", counterparty_reference="cp-gamma")

    first = sync_customer_counterparties(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    second = sync_customer_counterparties(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    assert first[0].id == second[0].id
    relationship = CustomerCounterpartyRelationship.objects.get(id=first[0].id)
    assert relationship.transaction_count == 1
    assert CounterpartyObservation.objects.filter(relationship=relationship).count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_observation_has_provenance(normalisation_context):
    txn = post(normalisation_context, source_event_id="cp-4", counterparty_reference="cp-delta")

    relationships = sync_customer_counterparties(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    observation = relationships[0].observations.get()
    assert observation.provenance_type == "normalisation.CanonicalTransaction"
    assert observation.provenance_id == txn.id


@pytest.mark.integration
@pytest.mark.django_db
def test_institution_wide_counterparty_profile_is_shared_across_customers(normalisation_context):
    post(normalisation_context, source_event_id="cp-5", counterparty_reference="cp-epsilon")

    sync_customer_counterparties(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    assert (
        CounterpartyProfile.objects.filter(
            institution=normalisation_context[1], counterparty_reference="cp-epsilon"
        ).count()
        == 1
    )
