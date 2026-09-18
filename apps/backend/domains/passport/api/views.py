from __future__ import annotations

from typing import Any
from uuid import UUID

from django.core.exceptions import PermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from domains.identity.api.permissions import HasPermission
from domains.identity.models import User
from domains.identity.services import user_has_permission
from domains.partner.models import Institution, InstitutionMembership
from domains.passport.api.serializers import (
    AccessPassportShareSerializer,
    CreatePassportShareSerializer,
    PassportShareSerializer,
    PassportSnapshotSerializer,
)
from domains.passport.models import FinancialPassport, PassportShare
from domains.passport.services import (
    access_passport_share,
    create_passport_share,
    generate_passport_snapshot,
    revoke_passport_share,
)
from packages.common.api import require_institution_id


def _as_api_error(exc: DjangoValidationError) -> DRFValidationError:
    return DRFValidationError(exc.message_dict if hasattr(exc, "message_dict") else str(exc))


class PassportView(APIView):
    """Institution-facing: retrieve or (re)generate a customer's current
    passport snapshot at the active institution.
    """

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "passport:read"

    @extend_schema(responses=PassportSnapshotSerializer)
    def get(self, request: Request, customer_id: UUID) -> Response:
        institution_id = require_institution_id(request)
        passport = FinancialPassport.objects.filter(
            institution_id=institution_id, customer_id=customer_id
        ).first()
        if passport is None or passport.current_snapshot is None:
            return Response(
                {"error": {"code": "not_found", "message": "No passport snapshot yet."}},
                status=404,
            )
        return Response({"data": PassportSnapshotSerializer(passport.current_snapshot).data})

    @extend_schema(request=None, responses=PassportSnapshotSerializer)
    def post(self, request: Request, customer_id: UUID) -> Response:
        institution_id = require_institution_id(request)
        if not user_has_permission(request.user, "passport:manage", institution_id):
            raise PermissionDenied("You do not have the required permission.")
        institution = Institution.objects.get(id=institution_id)
        customer = User.objects.get(id=customer_id)
        try:
            snapshot = generate_passport_snapshot(institution=institution, customer=customer)
        except DjangoValidationError as exc:
            raise _as_api_error(exc) from exc
        return Response(
            {"data": PassportSnapshotSerializer(snapshot).data}, status=status.HTTP_201_CREATED
        )


class PassportShareViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    serializer_class = PassportShareSerializer
    queryset = PassportShare.objects.none()  # schema-introspection fallback only

    def get_permissions(self) -> list[Any]:
        self.required_permission = "passport:read" if self.action == "list" else "passport:manage"
        return super().get_permissions()

    def get_queryset(self) -> Any:
        institution_id = require_institution_id(self.request)
        return (
            PassportShare.objects.filter(snapshot__passport__institution_id=institution_id)
            .select_related("snapshot__passport")
            .order_by("-created_at")
        )

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        serializer = CreatePassportShareSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        passport = FinancialPassport.objects.filter(
            institution=institution, customer_id=data["customer_id"]
        ).first()
        if passport is None or passport.current_snapshot is None:
            raise DRFValidationError("Customer has no passport snapshot at this institution yet.")
        recipient_institution = Institution.objects.get(id=data["recipient_institution_id"])
        try:
            share, token = create_passport_share(
                snapshot=passport.current_snapshot,
                institution=institution,
                recipient_institution=recipient_institution,
                purpose_code=data["purpose_code"],
                allowed_sections=data["allowed_sections"],
                created_by=request.user,
                expires_at=data["expires_at"],
            )
        except DjangoValidationError as exc:
            raise _as_api_error(exc) from exc
        payload = PassportShareSerializer(share).data
        # The plaintext token is returned exactly once and never persisted.
        payload["token"] = token
        return Response({"data": payload}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def revoke(self, request: Request, pk: str | None = None) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        share = self.get_object()
        try:
            revoked = revoke_passport_share(
                share=share, institution=institution, revoked_by=request.user
            )
        except DjangoValidationError as exc:
            raise _as_api_error(exc) from exc
        return Response({"data": PassportShareSerializer(revoked).data})


class PassportShareAccessView(APIView):
    """Recipient-institution endpoint: redeem a share token.

    Token possession plus active membership at the claimed accessor
    institution is the authorization here — this is deliberately not
    HasPermission/required_permission gated, since the recipient may be an
    institution with no other TAMVA-internal permissions at all.
    """

    throttle_scope = "passport_share_access"

    @extend_schema(request=AccessPassportShareSerializer, responses={200: dict})
    def post(self, request: Request) -> Response:
        institution_id = require_institution_id(request)
        if not InstitutionMembership.objects.filter(
            institution_id=institution_id, user=request.user, status="ACTIVE"
        ).exists():
            raise PermissionDenied("You are not an active member of the requesting institution.")
        institution = Institution.objects.get(id=institution_id)
        serializer = AccessPassportShareSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        sections = access_passport_share(
            token=data["token"],
            accessor_institution=institution,
            requested_sections=data.get("sections"),
        )
        return Response({"data": sections})
