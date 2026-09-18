from __future__ import annotations

from rest_framework import serializers

from domains.passport.models import PassportSectionCode, PassportShare, PassportSnapshot


class PassportSnapshotSerializer(serializers.ModelSerializer):
    sections = serializers.SerializerMethodField()

    class Meta:
        model = PassportSnapshot
        fields = ["id", "schema_version", "sections", "is_current", "created_at"]
        read_only_fields = fields

    def get_sections(self, obj: PassportSnapshot) -> dict[str, dict]:
        return {section.code: section.payload for section in obj.sections.all()}


class GeneratePassportSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField()


class PassportShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = PassportShare
        fields = [
            "id",
            "recipient_institution_id",
            "purpose_code",
            "allowed_sections",
            "status",
            "expires_at",
            "revoked_at",
            "created_at",
        ]
        read_only_fields = fields


class CreatePassportShareSerializer(serializers.Serializer):
    customer_id = serializers.UUIDField()
    recipient_institution_id = serializers.UUIDField()
    purpose_code = serializers.CharField(max_length=100)
    allowed_sections = serializers.ListField(
        child=serializers.ChoiceField(choices=PassportSectionCode.choices), allow_empty=False
    )
    expires_at = serializers.DateTimeField()


class AccessPassportShareSerializer(serializers.Serializer):
    token = serializers.CharField()
    sections = serializers.ListField(
        child=serializers.ChoiceField(choices=PassportSectionCode.choices), required=False
    )
