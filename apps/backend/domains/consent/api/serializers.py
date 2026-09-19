from __future__ import annotations

from typing import Any

from rest_framework import serializers

from domains.consent.models import Consent, ConsentPurpose, ConsentScope
from domains.partner.models import Institution


class ConsentSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    purpose_code = serializers.CharField(source="purpose.code", read_only=True)
    purpose_name = serializers.CharField(source="purpose.name", read_only=True)
    scope_codes = serializers.SerializerMethodField()

    class Meta:
        model = Consent
        fields = [
            "id",
            "institution_id",
            "institution_name",
            "purpose_code",
            "purpose_name",
            "scope_codes",
            "status",
            "granted_at",
            "expires_at",
            "revoked_at",
        ]
        read_only_fields = fields

    def get_scope_codes(self, obj: Consent) -> list[str]:
        return sorted(obj.scopes.values_list("code", flat=True))


class GrantConsentSerializer(serializers.Serializer):
    institution_id = serializers.UUIDField()
    purpose_code = serializers.CharField()
    scope_codes = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    expires_at = serializers.DateTimeField()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        try:
            institution = Institution.objects.get(id=attrs["institution_id"])
        except Institution.DoesNotExist as exc:
            raise serializers.ValidationError({"institution_id": "Institution not found."}) from exc
        try:
            purpose = ConsentPurpose.objects.get(
                institution=institution, code=attrs["purpose_code"]
            )
        except ConsentPurpose.DoesNotExist as exc:
            raise serializers.ValidationError(
                {"purpose_code": "Consent purpose not found for this institution."}
            ) from exc
        requested_codes = set(attrs["scope_codes"])
        scopes = list(ConsentScope.objects.filter(code__in=requested_codes))
        if len(scopes) != len(requested_codes):
            raise serializers.ValidationError({"scope_codes": "One or more scopes not found."})
        attrs["institution"] = institution
        attrs["purpose"] = purpose
        attrs["scopes"] = scopes
        return attrs
