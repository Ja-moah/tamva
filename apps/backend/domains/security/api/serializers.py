from __future__ import annotations

from collections.abc import Mapping
from datetime import timedelta
from typing import Any

from django.utils import timezone
from rest_framework import serializers

# Tolerated clock skew between an integration's clock and ours.
FUTURE_SKEW = timedelta(minutes=5)


class StrictSerializer(serializers.Serializer):
    """Rejects any field the contract does not define, so a client can never
    smuggle extra data (fingerprints, coordinates, blobs) through the API."""

    def to_internal_value(self, data: Any) -> Any:
        if isinstance(data, Mapping):
            unknown = sorted(set(data) - set(self.fields))
            if unknown:
                raise serializers.ValidationError({key: "Unknown field." for key in unknown})
        return super().to_internal_value(data)


class DevicePayloadSerializer(StrictSerializer):
    # Opaque identifier issued by the integration. Deliberately narrow: no
    # hardware identifiers, no free text.
    opaque_device_id = serializers.RegexField(r"^[A-Za-z0-9._:-]{8,128}$")


class LocationPayloadSerializer(StrictSerializer):
    country_code = serializers.RegexField(r"^[A-Za-z]{2}$")
    region = serializers.CharField(max_length=100, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    confidence = serializers.DecimalField(max_digits=5, decimal_places=4, min_value=0, max_value=1)


class ObservationSerializer(StrictSerializer):
    TYPES = ("DEVICE", "LOCATION")

    type = serializers.ChoiceField(choices=TYPES)
    customer_id = serializers.UUIDField()
    source = serializers.RegexField(r"^[a-z0-9_.-]{1,100}$")
    source_event_id = serializers.RegexField(r"^[A-Za-z0-9._:/-]{1,255}$")
    observed_at = serializers.DateTimeField()
    device = DevicePayloadSerializer(required=False)
    location = LocationPayloadSerializer(required=False)

    def validate_observed_at(self, value: Any) -> Any:
        if value > timezone.now() + FUTURE_SKEW:
            raise serializers.ValidationError("observed_at cannot be in the future.")
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        expected = attrs["type"].lower()
        other = "location" if expected == "device" else "device"
        if expected not in attrs:
            raise serializers.ValidationError({expected: "This payload is required for this type."})
        if other in attrs:
            raise serializers.ValidationError({other: "Not allowed for this type."})
        return attrs
