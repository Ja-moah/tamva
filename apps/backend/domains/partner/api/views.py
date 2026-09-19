from __future__ import annotations

from typing import Any
from uuid import UUID

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from domains.audit.services import record_audit
from domains.connector.models import InstitutionConnection
from domains.identity.api.permissions import HasPermission
from domains.identity.models import Permission, Role
from domains.partner.api.serializers import (
    MEMBER_STATUS_CHOICES,
    ApplicationSerializer,
    ConnectionSerializer,
    CreateApplicationSerializer,
    CreateEnvironmentSerializer,
    CreateWebhookSerializer,
    CredentialSerializer,
    EnvironmentSerializer,
    IssueCredentialSerializer,
    LocaleSettingsSerializer,
    MemberSerializer,
    PermissionSerializer,
    RoleSerializer,
    SetMemberStatusSerializer,
    SetRolesSerializer,
    WebhookSerializer,
)
from domains.partner.models import (
    ApiCredential,
    CredentialScope,
    Institution,
    InstitutionLocaleSettings,
    InstitutionMembership,
    PartnerApplication,
    PartnerEnvironment,
)
from domains.partner.services import (
    create_partner_application,
    create_partner_environment,
    create_webhook_endpoint,
    issue_api_credential,
    revoke_api_credential,
    rotate_api_credential,
)
from packages.common.api import require_institution_id
from packages.common.filtering import (
    FilteredListMixin,
    FilterSpec,
    SearchSpec,
    filter_parameters,
)

ADMIN_ROLE = "INSTITUTION_ADMIN"


def _institution(request: Request) -> Institution:
    try:
        return Institution.objects.get(id=require_institution_id(request))
    except Institution.DoesNotExist as exc:
        raise NotFound("Institution not found.") from exc


def _as_api_error(exc: DjangoValidationError) -> DRFValidationError:
    return DRFValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)


# ---------------------------------------------------------------- team

MEMBER_FILTERS = (
    FilterSpec("status", "status", "choice", choices=MEMBER_STATUS_CHOICES),
    FilterSpec("role", "roles__code", distinct=True),
)
MEMBER_SEARCH = SearchSpec(("user__email", "user__first_name", "user__last_name", "user__username"))
MEMBER_ORDERING = {
    "email": "user__email",
    "status": "status",
    "last_login": "user__last_login",
    "joined": "created_at",
}


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(
            MEMBER_FILTERS, search=MEMBER_SEARCH, ordering_fields=MEMBER_ORDERING
        )
    )
)
class TeamMemberViewSet(
    FilteredListMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Membership and RBAC for the active institution. Authorization is decided
    here, by the backend; the roles offered are the catalog roles only."""

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "team:read"
    serializer_class = MemberSerializer
    queryset = InstitutionMembership.objects.none()
    filter_specs = MEMBER_FILTERS
    search_spec = MEMBER_SEARCH
    ordering_fields = MEMBER_ORDERING
    default_ordering = ("user__email", "id")

    def get_permissions(self) -> list[Any]:
        self.required_permission = (
            "team:manage" if self.action in {"set_roles", "set_status"} else "team:read"
        )
        return super().get_permissions()

    def get_queryset(self) -> Any:
        return (
            InstitutionMembership.objects.filter(
                institution_id=require_institution_id(self.request)
            )
            .select_related("user")
            .prefetch_related("roles")
        )

    def _guard_change(self, membership: InstitutionMembership, request: Request) -> None:
        if membership.user_id == request.user.id:
            raise DRFValidationError({"detail": "You cannot change your own membership."})

    def _would_orphan_admin(
        self, membership: InstitutionMembership, *, still_admin: bool, still_active: bool
    ) -> bool:
        was_admin = membership.status == "ACTIVE" and any(
            role.code == ADMIN_ROLE for role in membership.roles.all()
        )
        if not was_admin or (still_admin and still_active):
            return False
        other_admins = (
            InstitutionMembership.objects.filter(
                institution_id=membership.institution_id,
                status="ACTIVE",
                roles__code=ADMIN_ROLE,
            )
            .exclude(pk=membership.pk)
            .exists()
        )
        return not other_admins

    @action(detail=True, methods=["post"], url_path="roles")
    def set_roles(self, request: Request, pk: str | None = None) -> Response:
        institution = _institution(request)
        membership = self.get_object()
        self._guard_change(membership, request)
        serializer = SetRolesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        codes = sorted(set(serializer.validated_data["roles"]))
        roles = list(Role.objects.filter(code__in=codes, scope_type="INSTITUTION"))
        unknown = sorted(set(codes) - {role.code for role in roles})
        if unknown:
            raise DRFValidationError({"roles": [f"Unknown roles: {', '.join(unknown)}."]})
        if self._would_orphan_admin(
            membership, still_admin=ADMIN_ROLE in codes, still_active=membership.status == "ACTIVE"
        ):
            raise DRFValidationError(
                {"detail": "An institution must keep an active administrator."}
            )
        with transaction.atomic():
            before = sorted(role.code for role in membership.roles.all())
            membership.roles.set(roles)
            record_audit(
                action="MEMBER_ROLES_CHANGED",
                actor=request.user,
                institution=institution,
                metadata={"membership_id": str(membership.id), "before": before, "after": codes},
            )
        membership = self.get_queryset().get(pk=membership.pk)
        return Response({"data": MemberSerializer(membership).data})

    @action(detail=True, methods=["post"], url_path="status")
    def set_status(self, request: Request, pk: str | None = None) -> Response:
        institution = _institution(request)
        membership = self.get_object()
        self._guard_change(membership, request)
        serializer = SetMemberStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        if self._would_orphan_admin(
            membership,
            still_admin=any(role.code == ADMIN_ROLE for role in membership.roles.all()),
            still_active=new_status == "ACTIVE",
        ):
            raise DRFValidationError(
                {"detail": "An institution must keep an active administrator."}
            )
        with transaction.atomic():
            previous = membership.status
            membership.status = new_status
            membership.save(update_fields=["status", "updated_at"])
            record_audit(
                action="MEMBER_STATUS_CHANGED",
                actor=request.user,
                institution=institution,
                metadata={
                    "membership_id": str(membership.id),
                    "before": previous,
                    "after": new_status,
                },
            )
        return Response({"data": MemberSerializer(membership).data})


class TeamRoleListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "team:read"

    @extend_schema(responses=RoleSerializer(many=True))
    def get(self, request: Request) -> Response:
        roles = Role.objects.filter(scope_type="INSTITUTION").prefetch_related("permissions")
        return Response({"data": RoleSerializer(roles.order_by("code"), many=True).data})


class TeamPermissionListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "team:read"

    @extend_schema(responses=PermissionSerializer(many=True))
    def get(self, request: Request) -> Response:
        return Response(
            {"data": PermissionSerializer(Permission.objects.order_by("code"), many=True).data}
        )


# ---------------------------------------------------------- integrations

APP_FILTERS = (
    FilterSpec("status", "status", "choice", choices=tuple(PartnerApplication.Status.values)),
)
APP_SEARCH = SearchSpec(("name", "slug"))
APP_ORDERING = {"name": "name", "created": "created_at", "status": "status"}


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(APP_FILTERS, search=APP_SEARCH, ordering_fields=APP_ORDERING)
    )
)
class PartnerApplicationViewSet(
    FilteredListMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "partner:read"
    serializer_class = ApplicationSerializer
    queryset = PartnerApplication.objects.none()
    filter_specs = APP_FILTERS
    search_spec = APP_SEARCH
    ordering_fields = APP_ORDERING
    default_ordering = ("name", "id")
    throttle_scope = "credential_ops"

    def get_permissions(self) -> list[Any]:
        self.required_permission = "partner:manage" if self.action == "create" else "partner:read"
        return super().get_permissions()

    def get_queryset(self) -> Any:
        return PartnerApplication.objects.filter(
            institution_id=require_institution_id(self.request)
        ).prefetch_related(
            "environments__api_credentials__scopes",
            "environments__webhook_endpoints",
        )

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        institution = _institution(request)
        serializer = CreateApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            application = create_partner_application(
                institution=institution, actor=request.user, **serializer.validated_data
            )
        except DjangoValidationError as exc:
            raise _as_api_error(exc) from exc
        return Response(
            {"data": ApplicationSerializer(application).data}, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["post"], url_path="environments")
    def add_environment(self, request: Request, pk: str | None = None) -> Response:
        institution = _institution(request)
        application = self.get_object()
        serializer = CreateEnvironmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            environment = create_partner_environment(
                application_id=application.id,
                institution=institution,
                actor=request.user,
                kind=PartnerEnvironment.Kind(serializer.validated_data["kind"]),
            )
        except DjangoValidationError as exc:
            raise _as_api_error(exc) from exc
        except IntegrityError as exc:
            raise DRFValidationError({"kind": ["This environment already exists."]}) from exc
        return Response({"data": EnvironmentSerializer(environment).data}, status=201)


class _CredentialWriteView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "partner:manage"
    throttle_scope = "credential_ops"

    @staticmethod
    def secret_response(issued: Any, status_code: int) -> Response:
        response = Response(
            {
                "data": {
                    "credential": CredentialSerializer(issued.credential).data,
                    "secret": issued.secret,
                    "secret_notice": "This secret is shown once and cannot be retrieved again.",
                }
            },
            status=status_code,
        )
        response["Cache-Control"] = "no-store"
        return response


class IssueCredentialView(_CredentialWriteView):
    @extend_schema(request=IssueCredentialSerializer, responses={201: None})
    def post(self, request: Request, environment_id: UUID) -> Response:
        institution = _institution(request)
        serializer = IssueCredentialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        scopes = list(CredentialScope.objects.filter(code__in=data["scopes"]))
        missing = sorted(set(data["scopes"]) - {scope.code for scope in scopes})
        if missing:
            raise DRFValidationError({"scopes": [f"Unknown scopes: {', '.join(missing)}."]})
        try:
            issued = issue_api_credential(
                environment_id=environment_id,
                institution=institution,
                actor=request.user,
                name=data["name"],
                scopes=scopes,
                expires_at=data["expires_at"],
            )
        except DjangoValidationError as exc:
            raise _as_api_error(exc) from exc
        return self.secret_response(issued, status.HTTP_201_CREATED)


class RotateCredentialView(_CredentialWriteView):
    @extend_schema(request=None, responses={201: None})
    def post(self, request: Request, credential_id: UUID) -> Response:
        try:
            with transaction.atomic():
                issued = rotate_api_credential(
                    credential_id=credential_id,
                    institution=_institution(request),
                    actor=request.user,
                )
        except DjangoValidationError as exc:
            raise _as_api_error(exc) from exc
        return self.secret_response(issued, status.HTTP_201_CREATED)


class RevokeCredentialView(_CredentialWriteView):
    @extend_schema(request=None, responses=CredentialSerializer)
    def post(self, request: Request, credential_id: UUID) -> Response:
        credential = revoke_api_credential(
            credential_id=credential_id, institution=_institution(request), actor=request.user
        )
        credential = ApiCredential.objects.prefetch_related("scopes").get(pk=credential.pk)
        return Response({"data": CredentialSerializer(credential).data})


class CreateWebhookView(_CredentialWriteView):
    @extend_schema(request=CreateWebhookSerializer, responses={201: WebhookSerializer})
    def post(self, request: Request, environment_id: UUID) -> Response:
        serializer = CreateWebhookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            endpoint = create_webhook_endpoint(
                environment_id=environment_id,
                institution=_institution(request),
                actor=request.user,
                **serializer.validated_data,
            )
        except DjangoValidationError as exc:
            raise _as_api_error(exc) from exc
        return Response({"data": WebhookSerializer(endpoint).data}, status=status.HTTP_201_CREATED)


class ScopeListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "partner:read"

    @extend_schema(responses=None)
    def get(self, request: Request) -> Response:
        scopes = CredentialScope.objects.filter(is_active=True).order_by("code")
        return Response(
            {
                "data": [
                    {"code": s.code, "name": s.name, "description": s.description} for s in scopes
                ]
            }
        )


CONNECTION_FILTERS = (
    FilterSpec("status", "status", "choice", choices=tuple(InstitutionConnection.Status.values)),
    FilterSpec("provider", "connector__provider"),
    FilterSpec("customer", "customer_id", "uuid"),
    FilterSpec("synced_from", "last_synced_at", "datetime", "gte"),
    FilterSpec("synced_to", "last_synced_at", "datetime", "lte"),
)
CONNECTION_ORDERING = {
    "last_synced_at": "last_synced_at",
    "status": "status",
    "provider": "connector__provider",
    "created": "created_at",
}


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(CONNECTION_FILTERS, ordering_fields=CONNECTION_ORDERING)
    )
)
class ConnectionViewSet(FilteredListMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Connection health only: no credential references, no external account ids."""

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "partner:read"
    serializer_class = ConnectionSerializer
    queryset = InstitutionConnection.objects.none()
    filter_specs = CONNECTION_FILTERS
    ordering_fields = CONNECTION_ORDERING
    default_ordering = ("-created_at", "id")

    def get_queryset(self) -> Any:
        return InstitutionConnection.objects.filter(
            institution_id=require_institution_id(self.request)
        ).select_related("connector")


# One source of truth: an unsaved instance carries the model's own field defaults.
_LOCALE_DEFAULTS = InstitutionLocaleSettings()
DEFAULT_LOCALE = {
    name: getattr(_LOCALE_DEFAULTS, name)
    for name in ("country_code", "default_currency", "timezone", "locale")
}


class InstitutionLocaleView(APIView):
    """Country/currency/timezone/locale for the active institution.

    Presentation defaults only: it never converts or restates financial records.
    Institutions with no stored settings report the Ghana-first defaults and
    `is_default: true`, so a client can tell defaults from a deliberate choice."""

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "overview:read"

    def get_permissions(self) -> list[Any]:
        self.required_permission = (
            "institution:manage" if self.request.method == "PATCH" else "overview:read"
        )
        return super().get_permissions()

    @extend_schema(responses=LocaleSettingsSerializer)
    def get(self, request: Request) -> Response:
        institution = _institution(request)
        stored = InstitutionLocaleSettings.objects.filter(institution=institution).first()
        if stored is None:
            return Response({"data": {**DEFAULT_LOCALE, "is_default": True}})
        return Response({"data": {**LocaleSettingsSerializer(stored).data, "is_default": False}})

    @extend_schema(request=LocaleSettingsSerializer, responses=LocaleSettingsSerializer)
    def patch(self, request: Request) -> Response:
        institution = _institution(request)
        stored, _ = InstitutionLocaleSettings.objects.get_or_create(institution=institution)
        serializer = LocaleSettingsSerializer(stored, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            serializer.save()
            record_audit(
                action="INSTITUTION_LOCALE_CHANGED",
                actor=request.user,
                institution=institution,
                metadata={"fields": sorted(serializer.validated_data)},
            )
        return Response({"data": {**LocaleSettingsSerializer(stored).data, "is_default": False}})
