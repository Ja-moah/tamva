from __future__ import annotations

import hashlib
import json
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from django.core.exceptions import PermissionDenied
from django.db import transaction

from domains.audit.models import AuditEvent
from domains.case.models import Case, CaseRiskEvent
from domains.connector.models import InstitutionConnection
from domains.identity.models import User
from domains.ledger.models import Account
from domains.normalisation.models import CanonicalTransaction
from domains.partner.models import Institution

from .models import (
    GraphComputationRun,
    GraphEdge,
    GraphEdgeType,
    GraphEvidence,
    GraphMetric,
    GraphNode,
    GraphNodeType,
)


def _get_or_create_node(
    *,
    institution: Institution,
    node_type: str,
    natural_key: str,
    reference_id: UUID | None = None,
    label: str = "",
) -> GraphNode:
    node, _ = GraphNode.objects.get_or_create(
        institution=institution,
        node_type=node_type,
        natural_key=natural_key,
        defaults={"reference_id": reference_id, "label": label},
    )
    return node


def _upsert_edge(
    *,
    institution: Institution,
    edge_type: str,
    source_node: GraphNode,
    target_node: GraphNode,
    occurred_at: datetime,
    provenance_type: str,
    provenance_id: UUID,
) -> GraphEdge:
    edge, _ = GraphEdge.objects.get_or_create(
        institution=institution,
        edge_type=edge_type,
        source_node=source_node,
        target_node=target_node,
        defaults={
            "first_occurred_at": occurred_at,
            "last_occurred_at": occurred_at,
            "occurrence_count": 0,
        },
    )
    _, evidence_created = GraphEvidence.objects.get_or_create(
        edge=edge,
        provenance_type=provenance_type,
        provenance_id=provenance_id,
        defaults={"observed_at": occurred_at},
    )
    if evidence_created:
        edge.occurrence_count += 1
        edge.first_occurred_at = min(edge.first_occurred_at, occurred_at)
        edge.last_occurred_at = max(edge.last_occurred_at, occurred_at)
        edge.save(
            update_fields=[
                "occurrence_count",
                "first_occurred_at",
                "last_occurred_at",
                "updated_at",
            ]
        )
    return edge


def _fingerprint(
    *,
    connections: list[InstitutionConnection],
    accounts: list[Account],
    transactions: list[CanonicalTransaction],
    cases: list[Case],
    case_risk_links: list[CaseRiskEvent],
    graph_version: str,
) -> str:
    payload = {
        "graph_version": graph_version,
        "connections": sorted(f"{c.id}:{c.status}" for c in connections),
        "accounts": sorted(f"{a.id}:{a.status}" for a in accounts),
        "transactions": sorted(str(t.id) for t in transactions),
        "cases": sorted(f"{c.id}:{c.status}" for c in cases),
        "case_risk_links": sorted(str(link.id) for link in case_risk_links),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _compute_metrics(
    *, run: GraphComputationRun, institution: Institution, account_nodes: list[GraphNode]
) -> None:
    unavailable_no_accounts = (
        "unique_counterparty_count",
        "transaction_partner_concentration",
        "repeat_counterparty_ratio",
        "network_activity_count",
    )
    if not account_nodes:
        GraphMetric.objects.create(
            run=run, code="account_count", numeric_value=Decimal("0"), available=True
        )
        for code in unavailable_no_accounts:
            GraphMetric.objects.create(
                run=run, code=code, available=False, unavailable_reason="no_accounts"
            )
    else:
        GraphMetric.objects.create(
            run=run, code="account_count", numeric_value=Decimal(len(account_nodes)), available=True
        )
        counterparty_edges = list(
            GraphEdge.objects.filter(
                institution=institution,
                edge_type=GraphEdgeType.ACCOUNT_TRANSACTED_WITH_COUNTERPARTY,
                source_node__in=account_nodes,
            )
        )
        if not counterparty_edges:
            for code in unavailable_no_accounts:
                GraphMetric.objects.create(
                    run=run, code=code, numeric_value=Decimal("0"), available=True
                )
        else:
            unique_counterparties = {edge.target_node_id for edge in counterparty_edges}
            total_occurrences = sum(edge.occurrence_count for edge in counterparty_edges)
            max_occurrences = max(edge.occurrence_count for edge in counterparty_edges)
            repeat_count = sum(1 for edge in counterparty_edges if edge.occurrence_count > 1)
            GraphMetric.objects.create(
                run=run,
                code="unique_counterparty_count",
                numeric_value=Decimal(len(unique_counterparties)),
                available=True,
            )
            GraphMetric.objects.create(
                run=run,
                code="network_activity_count",
                numeric_value=Decimal(total_occurrences),
                available=True,
            )
            GraphMetric.objects.create(
                run=run,
                code="transaction_partner_concentration",
                numeric_value=(Decimal(max_occurrences) / Decimal(total_occurrences)).quantize(
                    Decimal("0.000001")
                ),
                available=True,
            )
            GraphMetric.objects.create(
                run=run,
                code="repeat_counterparty_ratio",
                numeric_value=(
                    Decimal(repeat_count) / Decimal(len(unique_counterparties))
                ).quantize(Decimal("0.000001")),
                available=True,
            )

    # A genuine cross-institution count would require a platform-scoped
    # aggregate with its own privacy policy, which does not exist yet.
    # Marking this unsupported avoids either fabricating a value or
    # silently crossing the institution tenant boundary to compute one.
    GraphMetric.objects.create(
        run=run,
        code="institution_count",
        available=False,
        unavailable_reason="cross_tenant_aggregation_not_yet_authorized",
    )


@transaction.atomic
def sync_customer_graph(
    *, institution: Institution, customer: User, graph_version: str = "1"
) -> GraphComputationRun:
    connections = list(
        InstitutionConnection.objects.filter(institution=institution, customer=customer)
    )
    accounts = list(Account.objects.filter(institution=institution, customer=customer))
    if not connections and not accounts:
        raise PermissionDenied("Customer has no relationship with the active institution.")

    transactions = list(
        CanonicalTransaction.objects.filter(institution=institution, customer=customer)
        .exclude(counterparty_reference="")
        .order_by("occurred_at")
    )
    cases = list(Case.objects.filter(institution=institution, customer=customer))
    case_risk_links = list(
        CaseRiskEvent.objects.filter(case__in=cases).select_related("risk_event")
    )

    fingerprint = _fingerprint(
        connections=connections,
        accounts=accounts,
        transactions=transactions,
        cases=cases,
        case_risk_links=case_risk_links,
        graph_version=graph_version,
    )
    existing = GraphComputationRun.objects.filter(
        institution=institution,
        customer=customer,
        graph_version=graph_version,
        source_fingerprint=fingerprint,
    ).first()
    if existing:
        existing.status = GraphComputationRun.Status.REUSED
        existing.save(update_fields=["status", "updated_at"])
        return existing

    run = GraphComputationRun.objects.create(
        institution=institution,
        customer=customer,
        graph_version=graph_version,
        source_fingerprint=fingerprint,
    )

    customer_node = _get_or_create_node(
        institution=institution,
        node_type=GraphNodeType.CUSTOMER,
        natural_key=str(customer.id),
        reference_id=customer.id,
        label=customer.username,
    )
    institution_node = _get_or_create_node(
        institution=institution,
        node_type=GraphNodeType.INSTITUTION,
        natural_key=str(institution.id),
        reference_id=institution.id,
        label=institution.name,
    )

    for connection in connections:
        _upsert_edge(
            institution=institution,
            edge_type=GraphEdgeType.CUSTOMER_CONNECTED_TO_INSTITUTION,
            source_node=customer_node,
            target_node=institution_node,
            occurred_at=connection.created_at,
            provenance_type="connector.InstitutionConnection",
            provenance_id=connection.id,
        )

    account_node_by_id: dict[UUID, GraphNode] = {}
    for account in accounts:
        account_node = _get_or_create_node(
            institution=institution,
            node_type=GraphNodeType.ACCOUNT,
            natural_key=str(account.id),
            reference_id=account.id,
            label=account.source_account_reference,
        )
        account_node_by_id[account.id] = account_node
        _upsert_edge(
            institution=institution,
            edge_type=GraphEdgeType.CUSTOMER_OWNS_ACCOUNT,
            source_node=customer_node,
            target_node=account_node,
            occurred_at=account.created_at,
            provenance_type="ledger.Account",
            provenance_id=account.id,
        )

    accounts_by_reference = {account.source_account_reference: account for account in accounts}
    for txn in transactions:
        txn_account = accounts_by_reference.get(txn.source_account_reference)
        if txn_account is None:
            continue
        txn_account_node = account_node_by_id.get(txn_account.id)
        if txn_account_node is None:
            continue
        counterparty_node = _get_or_create_node(
            institution=institution,
            node_type=GraphNodeType.COUNTERPARTY,
            natural_key=txn.counterparty_reference,
            label=txn.counterparty_name,
        )
        _upsert_edge(
            institution=institution,
            edge_type=GraphEdgeType.ACCOUNT_TRANSACTED_WITH_COUNTERPARTY,
            source_node=txn_account_node,
            target_node=counterparty_node,
            occurred_at=txn.occurred_at,
            provenance_type="normalisation.CanonicalTransaction",
            provenance_id=txn.id,
        )

    for case in cases:
        case_node = _get_or_create_node(
            institution=institution,
            node_type=GraphNodeType.CASE,
            natural_key=str(case.id),
            reference_id=case.id,
            label=case.reference,
        )
        _upsert_edge(
            institution=institution,
            edge_type=GraphEdgeType.CASE_RELATES_TO_CUSTOMER,
            source_node=case_node,
            target_node=customer_node,
            occurred_at=case.opened_at,
            provenance_type="case.Case",
            provenance_id=case.id,
        )
        for link in case_risk_links:
            if link.case_id != case.id:
                continue
            risk_event = link.risk_event
            risk_event_node = _get_or_create_node(
                institution=institution,
                node_type=GraphNodeType.RISK_EVENT,
                natural_key=str(risk_event.id),
                reference_id=risk_event.id,
                label=risk_event.decision,
            )
            _upsert_edge(
                institution=institution,
                edge_type=GraphEdgeType.CASE_RELATES_TO_RISK_EVENT,
                source_node=case_node,
                target_node=risk_event_node,
                occurred_at=risk_event.evaluated_at,
                provenance_type="case.CaseRiskEvent",
                provenance_id=link.id,
            )

    _compute_metrics(
        run=run, institution=institution, account_nodes=list(account_node_by_id.values())
    )

    run.status = GraphComputationRun.Status.COMPLETED
    run.metadata = {
        "connection_count": len(connections),
        "account_count": len(accounts),
        "transaction_count": len(transactions),
        "case_count": len(cases),
    }
    run.save(update_fields=["status", "metadata", "updated_at"])
    AuditEvent.objects.create(
        institution=institution,
        action="GRAPH_COMPUTED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "graph_run_id": str(run.id),
            "customer_id": str(customer.id),
            "graph_version": graph_version,
        },
    )
    return run


def get_metric(run: GraphComputationRun, code: str) -> GraphMetric:
    return run.metrics.get(code=code)
