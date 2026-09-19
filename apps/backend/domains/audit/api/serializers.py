from rest_framework import serializers

from domains.audit.models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    actor_id = serializers.UUIDField(read_only=True, allow_null=True)

    class Meta:
        model = AuditEvent
        fields = ["id", "actor_id", "action", "outcome", "metadata", "created_at"]
        read_only_fields = fields
