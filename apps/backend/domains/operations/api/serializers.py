from __future__ import annotations

from typing import Any

from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from domains.operations.exports import validate_columns, validate_query
from domains.operations.models import ExportJob, ResourceType, SavedView
from domains.operations.resources import RESOURCES, can_read


class SavedViewSerializer(serializers.ModelSerializer):
    filters = serializers.DictField(child=serializers.CharField(allow_blank=True), required=False)
    visible_columns = serializers.ListField(
        child=serializers.CharField(max_length=100), required=False, max_length=50
    )

    class Meta:
        model = SavedView
        fields = [
            "id",
            "resource_type",
            "name",
            "filters",
            "ordering",
            "visible_columns",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        request = self.context["request"]
        institution_id = self.context["institution_id"]
        resource_type = attrs.get("resource_type") or (
            self.instance.resource_type if self.instance else None
        )
        if self.instance and "resource_type" in attrs and attrs["resource_type"] != resource_type:
            raise serializers.ValidationError({"resource_type": "Cannot be changed."})
        resource = RESOURCES.get(resource_type or "")
        if resource is None:
            raise serializers.ValidationError({"resource_type": "Unsupported resource."})
        if not can_read(resource, request.user, institution_id):
            raise PermissionDenied("You cannot view this resource.")
        filters = attrs.get("filters", self.instance.filters if self.instance else {})
        ordering = attrs.get("ordering", self.instance.ordering if self.instance else "")
        attrs["filters"] = validate_query(resource, filters, ordering)
        if "visible_columns" in attrs:
            attrs["visible_columns"] = validate_columns(
                resource, request.user, institution_id, attrs["visible_columns"]
            )
        return attrs


class ExportRequestSerializer(serializers.Serializer):
    resource_type = serializers.ChoiceField(choices=ResourceType.choices)
    format = serializers.ChoiceField(choices=ExportJob.Format.choices, default="CSV")
    filters = serializers.DictField(required=False, default=dict)
    ordering = serializers.CharField(required=False, allow_blank=True, default="", max_length=200)
    columns = serializers.ListField(
        child=serializers.CharField(max_length=100), required=False, default=list, max_length=50
    )
    selected_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=list, max_length=1000
    )


class ExportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportJob
        fields = [
            "id",
            "resource_type",
            "format",
            "filters",
            "ordering",
            "columns",
            "status",
            "row_count",
            "error_code",
            "artifact_size",
            "created_at",
            "completed_at",
            "expires_at",
        ]
        read_only_fields = fields
