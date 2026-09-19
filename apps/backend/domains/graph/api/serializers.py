from rest_framework import serializers

from domains.graph.models import GraphEdge, GraphMetric, GraphNode


class GraphNodeSerializer(serializers.ModelSerializer):
    # `metadata` is intentionally not exposed; label/type/reference identify a node.
    class Meta:
        model = GraphNode
        fields = ["id", "node_type", "label", "reference_id", "created_at"]
        read_only_fields = fields


class GraphEdgeSerializer(serializers.ModelSerializer):
    source_id = serializers.UUIDField(source="source_node_id", read_only=True)
    target_id = serializers.UUIDField(source="target_node_id", read_only=True)

    class Meta:
        model = GraphEdge
        fields = [
            "id",
            "edge_type",
            "source_id",
            "target_id",
            "occurrence_count",
            "first_occurred_at",
            "last_occurred_at",
        ]
        read_only_fields = fields


class GraphMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = GraphMetric
        fields = ["code", "numeric_value", "available", "unavailable_reason"]
        read_only_fields = fields
