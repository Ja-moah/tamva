from decimal import Decimal

import pytest
from django.core.exceptions import PermissionDenied

from domains.audit.models import AuditEvent
from domains.graph.models import (
    GraphComputationRun,
    GraphEdge,
    GraphEdgeType,
    GraphNode,
    GraphNodeType,
)
from domains.graph.services import sync_customer_graph
from domains.ledger.models import Account
from domains.ledger.services import post_transaction
from tests.integration.test_ledger import canonical_transaction


def post(context, *, source_event_id, **overrides):
    txn = canonical_transaction(context, source_event_id=source_event_id, **overrides)
    post_transaction(transaction_id=txn.id, institution=context[1])
    return txn


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_owns_account_edge_is_derived(normalisation_context):
    post(normalisation_context, source_event_id="graph-1")

    sync_customer_graph(institution=normalisation_context[1], customer=normalisation_context[0])

    account = Account.objects.get(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    customer_node = GraphNode.objects.get(
        institution=normalisation_context[1],
        node_type=GraphNodeType.CUSTOMER,
        natural_key=str(normalisation_context[0].id),
    )
    account_node = GraphNode.objects.get(
        institution=normalisation_context[1],
        node_type=GraphNodeType.ACCOUNT,
        natural_key=str(account.id),
    )
    edge = GraphEdge.objects.get(
        institution=normalisation_context[1],
        edge_type=GraphEdgeType.CUSTOMER_OWNS_ACCOUNT,
        source_node=customer_node,
        target_node=account_node,
    )
    assert edge.evidence.get().provenance_id == account.id


@pytest.mark.integration
@pytest.mark.django_db
def test_transaction_counterparty_edge_is_derived(normalisation_context):
    txn = post(normalisation_context, source_event_id="graph-2")

    sync_customer_graph(institution=normalisation_context[1], customer=normalisation_context[0])

    counterparty_node = GraphNode.objects.get(
        institution=normalisation_context[1],
        node_type=GraphNodeType.COUNTERPARTY,
        natural_key=txn.counterparty_reference,
    )
    edge = GraphEdge.objects.get(
        institution=normalisation_context[1],
        edge_type=GraphEdgeType.ACCOUNT_TRANSACTED_WITH_COUNTERPARTY,
        target_node=counterparty_node,
    )
    assert edge.occurrence_count == 1
    assert edge.evidence.get().provenance_id == txn.id


@pytest.mark.integration
@pytest.mark.django_db
def test_duplicate_source_processing_does_not_duplicate_edge(normalisation_context):
    post(normalisation_context, source_event_id="graph-3")

    first = sync_customer_graph(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    second = sync_customer_graph(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    assert first.id == second.id
    assert second.status == GraphComputationRun.Status.REUSED
    edge = GraphEdge.objects.get(
        institution=normalisation_context[1],
        edge_type=GraphEdgeType.ACCOUNT_TRANSACTED_WITH_COUNTERPARTY,
    )
    assert edge.occurrence_count == 1
    assert edge.evidence.count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_same_source_facts_produce_deterministic_metrics(normalisation_context):
    post(normalisation_context, source_event_id="graph-4")

    first = sync_customer_graph(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    second = sync_customer_graph(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    first_value = first.metrics.get(code="unique_counterparty_count").numeric_value
    second_value = second.metrics.get(code="unique_counterparty_count").numeric_value
    assert first_value == second_value == Decimal("1")


@pytest.mark.integration
@pytest.mark.django_db
def test_new_source_transaction_creates_new_snapshot(normalisation_context):
    post(normalisation_context, source_event_id="graph-5", counterparty_reference="cp-a")
    first = sync_customer_graph(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    post(
        normalisation_context,
        source_event_id="graph-6",
        counterparty_reference="cp-b",
        counterparty_name="Second Counterparty",
    )
    second = sync_customer_graph(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    assert first.id != second.id
    assert second.status == GraphComputationRun.Status.COMPLETED
    assert second.metrics.get(code="unique_counterparty_count").numeric_value == Decimal("2")


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_tenant_is_denied(normalisation_context):
    post(normalisation_context, source_event_id="graph-7")

    with pytest.raises(PermissionDenied):
        sync_customer_graph(institution=normalisation_context[2], customer=normalisation_context[0])


@pytest.mark.integration
@pytest.mark.django_db
def test_historical_graph_metrics_are_immutable(normalisation_context):
    post(normalisation_context, source_event_id="graph-8", counterparty_reference="cp-x")
    first = sync_customer_graph(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )
    original_value = first.metrics.get(code="unique_counterparty_count").numeric_value

    post(
        normalisation_context,
        source_event_id="graph-9",
        counterparty_reference="cp-y",
        counterparty_name="Another Counterparty",
    )
    sync_customer_graph(institution=normalisation_context[1], customer=normalisation_context[0])

    first.refresh_from_db()
    assert first.metrics.get(code="unique_counterparty_count").numeric_value == original_value


@pytest.mark.integration
@pytest.mark.django_db
def test_institution_count_is_explicitly_unsupported(normalisation_context):
    post(normalisation_context, source_event_id="graph-10")

    run = sync_customer_graph(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    metric = run.metrics.get(code="institution_count")
    assert metric.available is False
    assert metric.unavailable_reason == "cross_tenant_aggregation_not_yet_authorized"


@pytest.mark.integration
@pytest.mark.django_db
def test_graph_computation_is_audited(normalisation_context):
    post(normalisation_context, source_event_id="graph-11")

    run = sync_customer_graph(
        institution=normalisation_context[1], customer=normalisation_context[0]
    )

    assert AuditEvent.objects.filter(
        institution=normalisation_context[1],
        action="GRAPH_COMPUTED",
        metadata__graph_run_id=str(run.id),
    ).exists()
