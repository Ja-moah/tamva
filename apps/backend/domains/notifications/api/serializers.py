from __future__ import annotations

from rest_framework import serializers

from domains.notifications.models import Notification, NotificationChannel, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="template.category", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "category",
            "channel",
            "subject",
            "body",
            "status",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ["id", "category", "channel", "enabled"]
        read_only_fields = ["id"]


class SetNotificationPreferenceSerializer(serializers.Serializer):
    category = serializers.CharField(max_length=50)
    channel = serializers.ChoiceField(choices=NotificationChannel.choices)
    enabled = serializers.BooleanField()


class BulkReadSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(), min_length=1, max_length=200, allow_empty=False
    )
