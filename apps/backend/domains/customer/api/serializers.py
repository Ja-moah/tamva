from __future__ import annotations

from datetime import timedelta
from typing import Any

from django.utils import timezone
from rest_framework import serializers

from domains.connector.models import InstitutionConnection
from domains.consent.api.serializers import GrantConsentSerializer
from domains.customer import services
from domains.passport.models import PassportSectionCode, PassportShare


class MapSerializer(serializers.Serializer):  # type: ignore[type-arg]
    """Serializes an object through a read-model function, so the shape is owned
    by `services` and stays identical between list and detail responses."""

    mapper: Any = None

    def to_representation(self, instance: Any) -> Any:
        return type(self).mapper(instance)


def map_serializer(name: str, mapper: Any) -> type[MapSerializer]:
    return type(name, (MapSerializer,), {"mapper": staticmethod(mapper)})


ActivitySerializer = map_serializer("ActivitySerializer", services.activity_item)
ConfidenceHistorySerializer = map_serializer(
    "ConfidenceHistorySerializer", services.confidence_history_item
)


def _profile_history_item(snapshot: Any) -> dict[str, Any]:
    cash = getattr(snapshot, "cash_flow", None)
    return {
        "id": str(snapshot.id),
        "institution_id": str(snapshot.profile.institution_id),
        "institution_name": snapshot.profile.institution.name,
        "as_of": snapshot.period_end,
        "coverage_ratio": snapshot.coverage_ratio,
        "data_confidence": snapshot.confidence,
        "net_cash_flow": None if cash is None else cash.net_cash_flow,
        "is_current": snapshot.is_current,
    }


ProfileHistorySerializer = map_serializer("ProfileHistorySerializer", _profile_history_item)


class CustomerConnectionSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    provider = serializers.CharField(source="connector.provider", read_only=True)
    provider_name = serializers.CharField(source="connector.name", read_only=True)
    state = serializers.SerializerMethodField()

    class Meta:
        # No credential references, external account ids or provider metadata.
        model = InstitutionConnection
        fields = [
            "id",
            "institution_id",
            "institution_name",
            "provider",
            "provider_name",
            "purpose_code",
            "scope_code",
            "status",
            "state",
            "last_synced_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_state(self, obj: InstitutionConnection) -> str:
        if (
            obj.status == InstitutionConnection.Status.PAUSED
            and obj.metadata.get("authorization") == "PENDING_PROVIDER"
        ):
            return "PENDING_AUTHORIZATION"
        return obj.status


class CreateConnectionSerializer(serializers.Serializer):
    institution_id = serializers.UUIDField()
    provider = serializers.CharField(max_length=100)
    purpose_code = serializers.CharField(max_length=100)
    scope_code = serializers.CharField(max_length=100)
    external_reference = serializers.CharField(max_length=200)


def validate_duration(expires_at: Any) -> Any:
    now = timezone.now()
    if expires_at <= now:
        raise serializers.ValidationError("Expiry must be in the future.")
    if expires_at > now + timedelta(days=services.MAX_DAYS):
        raise serializers.ValidationError(
            f"Access can last at most {services.MAX_DAYS} days; renew it when needed."
        )
    return expires_at


class CustomerGrantConsentSerializer(GrantConsentSerializer):
    def validate_expires_at(self, value: Any) -> Any:
        return validate_duration(value)


class PassportGenerateSerializer(serializers.Serializer):
    institution_id = serializers.UUIDField()


class CustomerPassportShareSerializer(serializers.ModelSerializer):
    issuer_institution_id = serializers.UUIDField(
        source="snapshot.passport.institution_id", read_only=True
    )
    issuer_institution_name = serializers.CharField(
        source="snapshot.passport.institution.name", read_only=True
    )
    recipient_institution_name = serializers.CharField(
        source="recipient_institution.name", read_only=True
    )

    class Meta:
        model = PassportShare
        fields = [
            "id",
            "issuer_institution_id",
            "issuer_institution_name",
            "recipient_institution_id",
            "recipient_institution_name",
            "purpose_code",
            "allowed_sections",
            "status",
            "expires_at",
            "revoked_at",
            "created_at",
        ]
        read_only_fields = fields


class CreatePassportShareSerializer(serializers.Serializer):
    issuer_institution_id = serializers.UUIDField()
    recipient_institution_id = serializers.UUIDField()
    purpose_code = serializers.CharField(max_length=100)
    allowed_sections = serializers.ListField(
        child=serializers.ChoiceField(choices=PassportSectionCode.choices), allow_empty=False
    )
    expires_at = serializers.DateTimeField()

    def validate_expires_at(self, value: Any) -> Any:
        return validate_duration(value)
