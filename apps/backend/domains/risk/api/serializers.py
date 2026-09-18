from __future__ import annotations

from rest_framework import serializers

from domains.risk.models import RiskEvent, RiskReason


class RiskReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskReason
        fields = ["code", "source", "severity"]
        read_only_fields = fields


class RiskEventSerializer(serializers.ModelSerializer):
    reason_codes = serializers.SerializerMethodField()
    ruleset_version = serializers.SerializerMethodField()
    model_version = serializers.SerializerMethodField()
    policy_version = serializers.SerializerMethodField()

    class Meta:
        model = RiskEvent
        fields = [
            "id",
            "customer_id",
            "score",
            "decision",
            "confidence",
            "reason_codes",
            "ruleset_version",
            "model_version",
            "policy_version",
            "evaluated_at",
        ]
        read_only_fields = fields

    def get_reason_codes(self, obj: RiskEvent) -> list[str]:
        # obj.reasons is prefetched by the viewset's get_queryset; calling
        # .values_list() here would bypass that cache and re-query per row.
        return [reason.code for reason in obj.reasons.all()]

    def get_ruleset_version(self, obj: RiskEvent) -> str | None:
        if obj.ruleset_version is None:
            return None
        return f"{obj.ruleset_version.code}:{obj.ruleset_version.version}"

    def get_model_version(self, obj: RiskEvent) -> str | None:
        if obj.model_version is None:
            return None
        return f"{obj.model_version.model_definition.code}:{obj.model_version.version}"

    def get_policy_version(self, obj: RiskEvent) -> str:
        return f"{obj.policy_version.policy.code}:{obj.policy_version.version}"


class RiskEventDetailSerializer(RiskEventSerializer):
    reasons = RiskReasonSerializer(many=True, read_only=True)

    class Meta(RiskEventSerializer.Meta):
        fields = [*RiskEventSerializer.Meta.fields, "reasons"]
        read_only_fields = fields
