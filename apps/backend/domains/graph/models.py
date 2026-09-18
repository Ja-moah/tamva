from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError
from django.db import models

from domains.identity.models import User
from domains.partner.models import Institution
from packages.common.models import TimeStampedModel, UUIDModel


class GraphNodeType(models.TextChoices):
    CUSTOMER = "CUSTOMER", "Customer"
    INSTITUTION = "INSTITUTION", "Institution"
    ACCOUNT = "ACCOUNT", "Account"
    COUNTERPARTY = "COUNTERPARTY", "Counterparty"
    CASE = "CASE", "Case"
    RISK_EVENT = "RISK_EVENT", "Risk event"


class GraphEdgeType(models.TextChoices):
    CUSTOMER_OWNS_ACCOUNT = "CUSTOMER_OWNS_ACCOUNT", "Customer owns account"
    CUSTOMER_CONNECTED_TO_INSTITUTION = (
        "CUSTOMER_CONNECTED_TO_INSTITUTION",
        "Customer connected to institution",
    )
    ACCOUNT_TRANSACTED_WITH_COUNTERPARTY = (
        "ACCOUNT_TRANSACTED_WITH_COUNTERPARTY",
        "Account transacted with counterparty",
    )
    CASE_RELATES_TO_CUSTOMER = "CASE_RELATES_TO_CUSTOMER", "Case relates to customer"
    CASE_RELATES_TO_RISK_EVENT = "CASE_RELATES_TO_RISK_EVENT", "Case relates to risk event"


class GraphNode(UUIDModel, TimeStampedModel):
    """A trusted entity reference. Institution-scoped: the same underlying
    customer produces a distinct node per institution, so no relationship
    data can be read across a tenant boundary through the graph.
    """

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="graph_nodes"
    )
    node_type = models.CharField(max_length=20, choices=GraphNodeType)
    natural_key = models.CharField(max_length=255)
    reference_id = models.UUIDField(blank=True, null=True)
    label = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "node_type", "natural_key"], name="unique_graph_node"
            )
        ]
        indexes = [models.Index(fields=["institution", "node_type"])]


class GraphEdge(UUIDModel, TimeStampedModel):
    """A live, materialized relationship fact. Updated (not replaced) as new
    provenance arrives; see GraphEvidence for the immutable, append-only
    audit trail behind each edge.
    """

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="graph_edges"
    )
    edge_type = models.CharField(max_length=40, choices=GraphEdgeType)
    source_node = models.ForeignKey(
        GraphNode, on_delete=models.PROTECT, related_name="outgoing_edges"
    )
    target_node = models.ForeignKey(
        GraphNode, on_delete=models.PROTECT, related_name="incoming_edges"
    )
    occurrence_count = models.PositiveIntegerField(default=1)
    first_occurred_at = models.DateTimeField()
    last_occurred_at = models.DateTimeField()
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "edge_type", "source_node", "target_node"],
                name="unique_graph_edge",
            )
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.source_node_id and self.institution_id:
            if self.source_node.institution_id != self.institution_id:
                errors["source_node"] = "Edge institution must match its source node."
        if self.target_node_id and self.institution_id:
            if self.target_node.institution_id != self.institution_id:
                errors["target_node"] = "Edge institution must match its target node."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)


class GraphEvidence(UUIDModel):
    """One row per contributing source record. Append-only: proves exactly
    why an edge exists and prevents the same source record from being
    counted twice.
    """

    edge = models.ForeignKey(GraphEdge, on_delete=models.PROTECT, related_name="evidence")
    provenance_type = models.CharField(max_length=100)
    provenance_id = models.UUIDField()
    observed_at = models.DateTimeField()
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["observed_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["edge", "provenance_type", "provenance_id"], name="unique_graph_evidence"
            )
        ]


class GraphComputationRun(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        REUSED = "REUSED", "Reused"
        FAILED = "FAILED", "Failed"

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="graph_computation_runs"
    )
    customer = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="graph_computation_runs"
    )
    graph_version = models.CharField(max_length=50)
    source_fingerprint = models.CharField(max_length=64)
    status = models.CharField(max_length=20, choices=Status, default=Status.RUNNING)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "customer", "graph_version", "source_fingerprint"],
                name="unique_graph_computation_input",
            )
        ]


class GraphMetric(UUIDModel):
    run = models.ForeignKey(GraphComputationRun, on_delete=models.PROTECT, related_name="metrics")
    code = models.CharField(max_length=100)
    numeric_value = models.DecimalField(max_digits=20, decimal_places=6, blank=True, null=True)
    available = models.BooleanField(default=True)
    unavailable_reason = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["run", "code"], name="unique_graph_metric")]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if self.available and self.numeric_value is None:
            errors["numeric_value"] = "Available metrics must have a numeric value."
        if not self.available and not self.unavailable_reason:
            errors["unavailable_reason"] = "Unavailable metrics require a reason."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)
