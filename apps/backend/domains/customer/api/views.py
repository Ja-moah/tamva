from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from domains.connector.models import ConnectorDefinition, InstitutionConnection
from domains.connector.services import create_connection, revoke_connection
from domains.consent.api.serializers import ConsentSerializer
from domains.consent.models import Consent
from domains.consent.services import grant_consent, require_consent_access, revoke_consent
from domains.customer import services
from domains.customer.api.serializers import (
    ActivitySerializer,
    ConfidenceHistorySerializer,
    CreateConnectionSerializer,
    CreatePassportShareSerializer,
    CustomerConnectionSerializer,
    CustomerGrantConsentSerializer,
    CustomerPassportShareSerializer,
    PassportGenerateSerializer,
    ProfileHistorySerializer,
)
from domains.customer.permissions import IsCustomerActor
from domains.normalisation.models import CanonicalTransaction
from domains.partner.models import Institution
from domains.passport.api.serializers import PassportSnapshotSerializer
from domains.passport.models import FinancialPassport, PassportShare
from domains.passport.services import (
    create_passport_share,
    generate_passport_snapshot,
    revoke_passport_share,
)
from domains.profile.models import FinancialProfileSnapshot
from domains.security.api.serializers import SecurityEventSerializer
from domains.security.models import SecurityEvent
from packages.common.filtering import (
    FilteredListMixin,
    FilterSpec,
    SearchSpec,
    filter_parameters,
)
from packages.common.throttling import CUSTOMER_THROTTLES

CUSTOMER = [IsAuthenticated, IsCustomerActor]


def _api_error(exc: DjangoValidationError) -> DRFValidationError:
    return DRFValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)


class _CustomerViewSet(FilteredListMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = CUSTOMER
    throttle_classes = CUSTOMER_THROTTLES
    default_ordering: Sequence[str] = ("-created_at", "id")


# --------------------------------------------------------------------- home


class HomeView(APIView):
    permission_classes = CUSTOMER

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        return Response({"data": services.home(request.user)})


# ----------------------------------------------------------------- activity

ACTIVITY_FILTERS = (
    FilterSpec("date_from", "occurred_at", "datetime", "gte"),
    FilterSpec("date_to", "occurred_at", "datetime", "lte"),
    FilterSpec(
        "direction", "direction", "choice", choices=tuple(CanonicalTransaction.Direction.values)
    ),
    FilterSpec("category", "merchant_category"),
    FilterSpec("type", "transaction_type"),
    FilterSpec("currency", "currency"),
    FilterSpec("connection", "connection_id", "uuid"),
    FilterSpec("institution", "institution_id", "uuid"),
    FilterSpec("status", "status", "choice", choices=tuple(CanonicalTransaction.Status.values)),
)
ACTIVITY_SEARCH = SearchSpec(("counterparty_name", "merchant_category"))
ACTIVITY_ORDERING = {"occurred_at": "occurred_at", "amount": "amount"}


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(
            ACTIVITY_FILTERS, search=ACTIVITY_SEARCH, ordering_fields=ACTIVITY_ORDERING
        )
    )
)
class ActivityViewSet(_CustomerViewSet):
    """The customer's own canonical transactions. Never provider payloads."""

    serializer_class = ActivitySerializer
    queryset = CanonicalTransaction.objects.none()
    filter_specs = ACTIVITY_FILTERS
    search_spec = ACTIVITY_SEARCH
    ordering_fields = ACTIVITY_ORDERING
    default_ordering = ("-occurred_at", "id")

    def get_queryset(self) -> Any:
        return services.transactions(self.request.user)


# ------------------------------------------------------------------ profile


class ProfileCurrentView(APIView):
    permission_classes = CUSTOMER

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        return Response({"data": {"institutions": services.current_profiles(request.user)}})


PROFILE_FILTERS = (
    FilterSpec("institution", "profile__institution_id", "uuid"),
    FilterSpec("date_from", "period_end", "datetime", "gte"),
    FilterSpec("date_to", "period_end", "datetime", "lte"),
)


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(PROFILE_FILTERS, ordering_fields={"as_of": "period_end"})
    )
)
class ProfileHistoryViewSet(_CustomerViewSet):
    serializer_class = ProfileHistorySerializer
    queryset = FinancialProfileSnapshot.objects.none()
    filter_specs = PROFILE_FILTERS
    ordering_fields = {"as_of": "period_end"}
    default_ordering = ("-period_end", "-created_at", "id")

    def get_queryset(self) -> Any:
        return FinancialProfileSnapshot.objects.filter(
            profile__customer=self.request.user
        ).select_related("profile__institution", "cash_flow")


# --------------------------------------------------------------- confidence


class ConfidenceCurrentView(APIView):
    permission_classes = CUSTOMER

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        return Response(
            {
                "data": {
                    "scale": services.CONFIDENCE_SCALE,
                    "institutions": services.current_confidence(request.user),
                }
            }
        )


CONFIDENCE_FILTERS = (
    FilterSpec("institution", "institution_id", "uuid"),
    FilterSpec("date_from", "evaluated_at", "datetime", "gte"),
    FilterSpec("date_to", "evaluated_at", "datetime", "lte"),
)


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(CONFIDENCE_FILTERS, ordering_fields={"as_of": "evaluated_at"})
    )
)
class ConfidenceHistoryViewSet(_CustomerViewSet):
    serializer_class = ConfidenceHistorySerializer
    queryset = services.FinancialConfidenceSnapshot.objects.none()
    filter_specs = CONFIDENCE_FILTERS
    ordering_fields = {"as_of": "evaluated_at"}
    default_ordering = ("-evaluated_at", "-created_at", "id")

    def get_queryset(self) -> Any:
        return services.confidence_queryset(self.request.user)


# -------------------------------------------------------------- connections

CONNECTION_FILTERS = (
    FilterSpec("status", "status", "choice", choices=tuple(InstitutionConnection.Status.values)),
    FilterSpec("institution", "institution_id", "uuid"),
)


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(CONNECTION_FILTERS, ordering_fields={"created": "created_at"})
    )
)
class ConnectionViewSet(mixins.RetrieveModelMixin, _CustomerViewSet):
    serializer_class = CustomerConnectionSerializer
    queryset = InstitutionConnection.objects.none()
    filter_specs = CONNECTION_FILTERS
    ordering_fields = {"created": "created_at"}

    def get_queryset(self) -> Any:
        return services.connections(self.request.user)

    @extend_schema(
        request=CreateConnectionSerializer, responses={201: CustomerConnectionSerializer}
    )
    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Starts a connection. Provider authorization happens with the provider,
        so the connection is created PENDING_AUTHORIZATION; no credential is
        fabricated, and the customer must already have consented to this
        institution, purpose and scope."""
        serializer = CreateConnectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        institution = Institution.objects.filter(id=data["institution_id"], is_active=True).first()
        connector = ConnectorDefinition.objects.filter(
            provider=data["provider"], status=ConnectorDefinition.Status.ACTIVE
        ).first()
        if institution is None or connector is None:
            raise DRFValidationError({"detail": "Unknown institution or provider."})
        # The customer must already have consented to this institution, purpose and
        # scope; missing consent surfaces as 403 (Django PermissionDenied).
        require_consent_access(
            customer_id=request.user.id,
            institution_id=institution.id,
            purpose_code=data["purpose_code"],
            scope_code=data["scope_code"],
        )
        try:
            with transaction.atomic():
                connection = create_connection(
                    institution=institution,
                    customer_id=request.user.id,
                    connector=connector,
                    external_reference=data["external_reference"],
                    purpose_code=data["purpose_code"],
                    scope_code=data["scope_code"],
                    credential_reference="pending-provider-authorization",
                    credential_type="pending",
                    metadata={"authorization": "PENDING_PROVIDER"},
                )
                connection.status = InstitutionConnection.Status.PAUSED
                connection.save(update_fields=["status", "updated_at"])
        except IntegrityError as exc:
            raise DRFValidationError({"detail": "This connection already exists."}) from exc
        except DjangoValidationError as exc:
            raise _api_error(exc) from exc
        return Response(
            {"data": CustomerConnectionSerializer(connection).data}, status=status.HTTP_201_CREATED
        )

    @extend_schema(request=None, responses=CustomerConnectionSerializer)
    @action(detail=True, methods=["post"])
    def disconnect(self, request: Request, pk: str | None = None) -> Response:
        connection = revoke_connection(connection=self.get_object(), actor=request.user)
        return Response({"data": CustomerConnectionSerializer(connection).data})


# ------------------------------------------------------------------ consent


class ConsentCatalogueView(APIView):
    permission_classes = CUSTOMER

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        return Response({"data": services.consent_catalogue()})


CONSENT_FILTERS = (
    FilterSpec("status", "status", "choice", choices=tuple(Consent.Status.values)),
    FilterSpec("institution", "institution_id", "uuid"),
)


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(CONSENT_FILTERS, ordering_fields={"granted": "granted_at"})
    )
)
class ConsentViewSet(mixins.RetrieveModelMixin, _CustomerViewSet):
    serializer_class = ConsentSerializer
    queryset = Consent.objects.none()
    filter_specs = CONSENT_FILTERS
    ordering_fields = {"granted": "granted_at"}
    default_ordering = ("-granted_at", "id")

    def get_queryset(self) -> Any:
        return (
            Consent.objects.filter(customer=self.request.user)
            .select_related("purpose", "institution")
            .prefetch_related("scopes")
        )

    @extend_schema(request=CustomerGrantConsentSerializer, responses={201: ConsentSerializer})
    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = CustomerGrantConsentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            consent = grant_consent(
                customer=request.user,
                institution=data["institution"],
                purpose=data["purpose"],
                scopes=data["scopes"],
                actor=request.user,
                expires_at=data["expires_at"],
            )
        except DjangoValidationError as exc:
            raise _api_error(exc) from exc
        return Response({"data": ConsentSerializer(consent).data}, status=status.HTTP_201_CREATED)

    @extend_schema(request=None, responses=ConsentSerializer)
    @action(detail=True, methods=["post"])
    def revoke(self, request: Request, pk: str | None = None) -> Response:
        consent = self.get_object()
        revoked = revoke_consent(
            consent_id=consent.id, institution=consent.institution, actor=request.user
        )
        return Response({"data": ConsentSerializer(revoked).data})


# ----------------------------------------------------------------- passport


class PassportCurrentView(APIView):
    permission_classes = CUSTOMER

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        passports = services.current_passports(request.user).prefetch_related(
            "current_snapshot__sections"
        )
        return Response(
            {
                "data": {
                    "institutions": [
                        {
                            "institution_id": str(p.institution_id),
                            "institution_name": p.institution.name,
                            "snapshot": PassportSnapshotSerializer(p.current_snapshot).data,
                        }
                        for p in passports
                    ]
                }
            }
        )


class PassportGenerateView(APIView):
    permission_classes = CUSTOMER
    throttle_classes = CUSTOMER_THROTTLES

    @extend_schema(request=PassportGenerateSerializer, responses=OpenApiTypes.OBJECT)
    def post(self, request: Request) -> Response:
        serializer = PassportGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        institution = Institution.objects.filter(
            id=serializer.validated_data["institution_id"], is_active=True
        ).first()
        # Only institutions the customer already has a profile with can issue a passport.
        if (
            institution is None
            or not institution.financial_profiles.filter(customer=request.user).exists()
        ):
            raise NotFound("No financial profile with this institution.")
        try:
            snapshot = generate_passport_snapshot(institution=institution, customer=request.user)
        except DjangoValidationError as exc:
            raise _api_error(exc) from exc
        return Response(
            {"data": PassportSnapshotSerializer(snapshot).data}, status=status.HTTP_201_CREATED
        )


SHARE_FILTERS = (
    FilterSpec("status", "status", "choice", choices=tuple(PassportShare.Status.values)),
    FilterSpec("recipient", "recipient_institution_id", "uuid"),
)


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(SHARE_FILTERS, ordering_fields={"created": "created_at"})
    )
)
class PassportShareViewSet(_CustomerViewSet):
    """Shares are recipient-specific, purpose-specific, scoped, time-limited and
    revocable. Creating one needs the customer's own consent to the recipient."""

    serializer_class = CustomerPassportShareSerializer
    queryset = PassportShare.objects.none()
    filter_specs = SHARE_FILTERS
    ordering_fields = {"created": "created_at"}

    def get_queryset(self) -> Any:
        return services.shares(self.request.user)

    @extend_schema(request=CreatePassportShareSerializer, responses={201: OpenApiTypes.OBJECT})
    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = CreatePassportShareSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        passport = (
            FinancialPassport.objects.filter(
                customer=request.user, institution_id=data["issuer_institution_id"]
            )
            .select_related("institution", "current_snapshot")
            .first()
        )
        if passport is None or passport.current_snapshot is None:
            raise DRFValidationError({"detail": "Generate a passport for this institution first."})
        recipient = Institution.objects.filter(
            id=data["recipient_institution_id"], is_active=True
        ).first()
        if recipient is None:
            raise DRFValidationError({"recipient_institution_id": ["Unknown recipient."]})
        try:
            share, token = create_passport_share(
                snapshot=passport.current_snapshot,
                institution=passport.institution,
                recipient_institution=recipient,
                purpose_code=data["purpose_code"],
                allowed_sections=data["allowed_sections"],
                created_by=request.user,
                expires_at=data["expires_at"],
            )
        except DjangoPermissionDenied as exc:
            # Sharing requires the customer's own consent to this recipient.
            raise DRFValidationError({"detail": str(exc)}) from exc
        except DjangoValidationError as exc:
            raise _api_error(exc) from exc
        payload = CustomerPassportShareSerializer(
            services.shares(request.user).get(pk=share.pk)
        ).data | {"token": token}  # shown once; only its hash is stored
        response = Response({"data": payload}, status=status.HTTP_201_CREATED)
        response["Cache-Control"] = "no-store"
        return response

    @extend_schema(request=None, responses=CustomerPassportShareSerializer)
    @action(detail=True, methods=["post"])
    def revoke(self, request: Request, pk: str | None = None) -> Response:
        share = self.get_object()
        try:
            revoked = revoke_passport_share(
                share=share,
                institution=share.snapshot.passport.institution,
                revoked_by=request.user,
            )
        except DjangoValidationError as exc:
            raise _api_error(exc) from exc
        return Response({"data": CustomerPassportShareSerializer(revoked).data})


# ----------------------------------------------------------------- security


class SecuritySummaryView(APIView):
    permission_classes = CUSTOMER

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request: Request) -> Response:
        from packages.common.capabilities import CAPABILITIES

        unsupported = (
            "dark_web_monitoring",
            "external_breach_monitoring",
            "account_takeover_detection",
        )
        return Response(
            {
                "data": services.security_summary(request.user)
                | {"unsupported": {code: CAPABILITIES[code].value for code in unsupported}}
            }
        )


SECURITY_FILTERS = (
    FilterSpec("category", "category", "choice", choices=tuple(SecurityEvent.Category.values)),
    FilterSpec("severity", "severity", "choice", choices=tuple(SecurityEvent.Severity.values)),
    FilterSpec("date_from", "occurred_at", "datetime", "gte"),
    FilterSpec("date_to", "occurred_at", "datetime", "lte"),
)


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(
            SECURITY_FILTERS, ordering_fields={"occurred_at": "occurred_at"}
        )
    )
)
class SecurityEventViewSet(_CustomerViewSet):
    """Signals about the customer's own devices and locations (no producer metadata)."""

    serializer_class = SecurityEventSerializer
    queryset = SecurityEvent.objects.none()
    filter_specs = SECURITY_FILTERS
    ordering_fields = {"occurred_at": "occurred_at"}
    default_ordering = ("-occurred_at", "id")

    def get_queryset(self) -> Any:
        return SecurityEvent.objects.filter(customer=self.request.user)
