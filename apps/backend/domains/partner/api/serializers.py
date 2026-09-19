from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from domains.connector.models import InstitutionConnection
from domains.identity.models import Permission, Role
from domains.partner.models import (
    ApiCredential,
    InstitutionLocaleSettings,
    InstitutionMembership,
    PartnerApplication,
    PartnerEnvironment,
    WebhookEndpoint,
)

MEMBER_STATUS_CHOICES = ("ACTIVE", "SUSPENDED", "ENDED")


class MemberSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.SerializerMethodField()
    actor_type = serializers.CharField(source="user.identity_type", read_only=True)
    last_login = serializers.DateTimeField(source="user.last_login", read_only=True)
    roles = serializers.SerializerMethodField()

    class Meta:
        model = InstitutionMembership
        fields = [
            "id",
            "user_id",
            "email",
            "name",
            "actor_type",
            "status",
            "roles",
            "last_login",
            "created_at",
        ]
        read_only_fields = fields

    def get_name(self, obj: InstitutionMembership) -> str:
        full = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full or obj.user.username

    def get_roles(self, obj: InstitutionMembership) -> list[str]:
        return sorted(role.code for role in obj.roles.all())


class SetRolesSerializer(serializers.Serializer):
    roles = serializers.ListField(child=serializers.CharField(max_length=100), max_length=20)


class SetMemberStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=MEMBER_STATUS_CHOICES)


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["code", "name", "description"]
        read_only_fields = fields


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ["code", "name", "description", "permissions"]
        read_only_fields = fields

    def get_permissions(self, obj: Role) -> list[str]:
        return sorted(permission.code for permission in obj.permissions.all())


class CredentialSerializer(serializers.ModelSerializer):
    """Credential metadata only. The secret is never stored in plaintext and is
    returned exactly once, by the issue/rotate response."""

    scopes = serializers.SerializerMethodField()

    class Meta:
        model = ApiCredential
        fields = [
            "id",
            "name",
            "client_id",
            "status",
            "scopes",
            "expires_at",
            "revoked_at",
            "last_used_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_scopes(self, obj: ApiCredential) -> list[str]:
        return sorted(scope.code for scope in obj.scopes.all())


class WebhookSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEndpoint
        fields = ["id", "url", "event_types", "status", "verified_at", "created_at"]
        read_only_fields = fields


class EnvironmentSerializer(serializers.ModelSerializer):
    credentials = CredentialSerializer(source="api_credentials", many=True, read_only=True)
    webhooks = WebhookSerializer(source="webhook_endpoints", many=True, read_only=True)

    class Meta:
        model = PartnerEnvironment
        fields = ["id", "kind", "status", "credentials", "webhooks"]
        read_only_fields = fields


class ApplicationSerializer(serializers.ModelSerializer):
    environments = EnvironmentSerializer(many=True, read_only=True)

    class Meta:
        model = PartnerApplication
        fields = ["id", "name", "slug", "description", "status", "environments", "created_at"]
        read_only_fields = fields


class CreateApplicationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    slug = serializers.SlugField(max_length=100)
    description = serializers.CharField(allow_blank=True, required=False, default="")


class CreateEnvironmentSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=PartnerEnvironment.Kind.choices)


class IssueCredentialSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    scopes = serializers.ListField(child=serializers.CharField(), min_length=1, max_length=50)
    expires_at = serializers.DateTimeField(required=False, allow_null=True, default=None)


class CreateWebhookSerializer(serializers.Serializer):
    url = serializers.URLField(max_length=500)
    event_types = serializers.ListField(child=serializers.CharField(), min_length=1, max_length=50)


class ConnectionSerializer(serializers.ModelSerializer):
    provider = serializers.CharField(source="connector.provider", read_only=True)
    provider_name = serializers.CharField(source="connector.name", read_only=True)
    customer_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = InstitutionConnection
        fields = [
            "id",
            "provider",
            "provider_name",
            "customer_id",
            "purpose_code",
            "scope_code",
            "status",
            "last_synced_at",
            "created_at",
        ]
        read_only_fields = fields


class LocaleSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstitutionLocaleSettings
        fields = ["country_code", "default_currency", "timezone", "locale"]

    def validate(self, attrs: dict) -> dict:
        # Reuse the model's validation so API and admin agree on what is legal.
        current = {f: getattr(self.instance, f) for f in self.fields} if self.instance else {}
        candidate = InstitutionLocaleSettings(**{**current, **attrs})
        try:
            candidate.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict) from exc
        return attrs
