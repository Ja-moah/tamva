from __future__ import annotations

from rest_framework import serializers

from domains.case.models import (
    Case,
    CaseAction,
    CaseAssignment,
    CaseNote,
    CaseResolution,
    CaseStatusEvent,
)


class CaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = [
            "id",
            "reference",
            "customer_id",
            "case_type",
            "priority",
            "status",
            "source",
            "current_assignee_id",
            "opened_at",
            "closed_at",
        ]
        read_only_fields = fields


class CaseStatusEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseStatusEvent
        fields = ["previous_status", "new_status", "actor_id", "note", "occurred_at"]
        read_only_fields = fields


class CaseAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseAssignment
        fields = ["assignee_id", "assigned_by_id", "note", "assigned_at"]
        read_only_fields = fields


class CaseNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseNote
        fields = ["id", "author_id", "body", "created_at"]
        read_only_fields = fields


class CaseActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseAction
        fields = ["id", "action_type", "actor_id", "detail", "created_at"]
        read_only_fields = fields


class CaseResolutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseResolution
        fields = ["outcome", "reason", "resolved_by_id", "resolved_at"]
        read_only_fields = fields


class CaseDetailSerializer(CaseSerializer):
    status_events = CaseStatusEventSerializer(many=True, read_only=True)
    assignments = CaseAssignmentSerializer(many=True, read_only=True)
    notes = CaseNoteSerializer(many=True, read_only=True)
    actions = CaseActionSerializer(many=True, read_only=True)
    resolution = CaseResolutionSerializer(read_only=True)

    class Meta(CaseSerializer.Meta):
        fields = [
            *CaseSerializer.Meta.fields,
            "status_events",
            "assignments",
            "notes",
            "actions",
            "resolution",
        ]
        read_only_fields = fields


class ManualCaseCreateSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField()
    case_type = serializers.CharField(max_length=100)
    priority = serializers.ChoiceField(choices=Case.Priority.choices)


class AssignCaseSerializer(serializers.Serializer):
    assignee_id = serializers.UUIDField(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class TransitionCaseSerializer(serializers.Serializer):
    new_status = serializers.ChoiceField(choices=Case.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class AddCaseNoteSerializer(serializers.Serializer):
    body = serializers.CharField()


class RecordCaseActionSerializer(serializers.Serializer):
    action_type = serializers.ChoiceField(choices=CaseAction.ActionType.choices)
    detail = serializers.JSONField(required=False, default=dict)


class ResolveCaseSerializer(serializers.Serializer):
    outcome = serializers.ChoiceField(choices=CaseResolution.Outcome.choices)
    reason = serializers.CharField()


class BulkAssignCasesSerializer(serializers.Serializer):
    case_ids = serializers.ListField(
        child=serializers.UUIDField(), min_length=1, max_length=100, allow_empty=False
    )
    assignee_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    note = serializers.CharField(required=False, allow_blank=True, default="", max_length=2000)


class BulkTriageCasesSerializer(serializers.Serializer):
    case_ids = serializers.ListField(
        child=serializers.UUIDField(), min_length=1, max_length=100, allow_empty=False
    )
    note = serializers.CharField(required=False, allow_blank=True, default="", max_length=2000)
