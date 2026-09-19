from uuid import UUID

from django.contrib.auth import login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import PermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from domains.audit.models import AuditEvent
from domains.identity.api.serializers import (
    CustomerRegistrationSerializer,
    LoginSerializer,
    RecoveryConfirmSerializer,
    RecoveryRequestSerializer,
    RefreshRequestSerializer,
    RevokeRequestSerializer,
    TokenRequestSerializer,
)
from domains.identity.models import AuthSession, AuthToken, User
from domains.identity.recovery import confirm_recovery, request_recovery
from domains.identity.services import ActorContext, build_actor_context
from domains.identity.tokens import (
    IssuedTokens,
    TokenError,
    hash_token,
    revoke_all_sessions,
    revoke_session,
    rotate,
    start_session,
)


def _institution_id(request: Request) -> UUID | None:
    value = request.headers.get("X-Institution-ID")
    if not value:
        return None
    try:
        return UUID(value)
    except ValueError as exc:
        raise PermissionDenied("X-Institution-ID must be a valid UUID.") from exc


def _context_payload(context: ActorContext) -> dict:
    institution = context.institution
    return {
        "user": {
            "id": str(context.user.id),
            "email": context.user.email,
            "actor_type": context.user.identity_type,
            "status": context.user.status,
        },
        "tenant": (
            {
                "institution_id": str(institution.id),
                "institution_name": institution.name,
            }
            if institution
            else None
        ),
        "memberships": [
            {
                "institution_id": str(membership.institution_id),
                "institution_name": membership.institution.name,
            }
            for membership in context.memberships
        ],
        "roles": list(context.roles),
        "permissions": list(context.permissions),
    }


_actor_context_response = inline_serializer(
    name="ActorContextEnvelope",
    fields={
        "data": inline_serializer(
            name="ActorContext",
            fields={
                "user": inline_serializer(
                    name="ActorUser",
                    fields={
                        "id": serializers.UUIDField(),
                        "email": serializers.EmailField(),
                        "actor_type": serializers.CharField(),
                        "status": serializers.CharField(),
                    },
                ),
                "tenant": inline_serializer(
                    name="ActorTenant",
                    fields={
                        "institution_id": serializers.UUIDField(),
                        "institution_name": serializers.CharField(),
                    },
                ),
                "memberships": inline_serializer(
                    name="ActorMembership",
                    fields={
                        "institution_id": serializers.UUIDField(),
                        "institution_name": serializers.CharField(),
                    },
                    many=True,
                ),
                "roles": serializers.ListField(child=serializers.CharField()),
                "permissions": serializers.ListField(child=serializers.CharField()),
            },
        )
    },
)


def _audit(
    *,
    user: User | None,
    action: str,
    outcome: str,
    request: Request,
    metadata: dict | None = None,
) -> None:
    AuditEvent.objects.create(
        actor=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        outcome=outcome,
        metadata={"ip_address": request.META.get("REMOTE_ADDR"), **(metadata or {})},
    )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"  # brute-force ceiling on the cookie-session login too
    authentication_classes = [SessionAuthentication]

    @extend_schema(request=LoginSerializer, responses=_actor_context_response)
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            _audit(
                user=None,
                action="LOGIN",
                outcome=AuditEvent.Outcome.FAILURE,
                request=request,
            )
            raise
        user = serializer.validated_data["user"]
        login(request, user)
        _audit(user=user, action="LOGIN", outcome=AuditEvent.Outcome.SUCCESS, request=request)
        return Response({"data": _context_payload(build_actor_context(user))})


class RefreshView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses=_actor_context_response)
    def post(self, request: Request) -> Response:
        request.session.cycle_key()
        context = build_actor_context(request.user, _institution_id(request))
        return Response({"data": _context_payload(context)})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={204: None})
    def post(self, request: Request) -> Response:
        _audit(
            user=request.user,
            action="LOGOUT",
            outcome=AuditEvent.Outcome.SUCCESS,
            request=request,
        )
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=_actor_context_response)
    def get(self, request: Request) -> Response:
        context = build_actor_context(request.user, _institution_id(request))
        return Response({"data": _context_payload(context)})


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    """Hands a CSRF token to clients that cannot read cookies (native apps).

    Session auth requires unsafe requests to echo the token in `X-CSRFToken`.
    Browsers can read the `csrftoken` cookie; React Native cannot, so it asks
    here after sign-in (the token rotates on login) and whenever a request is
    refused. The token is also set as a cookie, so both halves agree. It grants
    nothing by itself: it is only useful together with the session cookie.
    """

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        responses=inline_serializer(
            name="CsrfEnvelope",
            fields={
                "data": inline_serializer(
                    name="CsrfToken", fields={"csrf_token": serializers.CharField()}
                )
            },
        )
    )
    def get(self, request: Request) -> Response:
        response = Response({"data": {"csrf_token": get_token(request)}})
        response["Cache-Control"] = "no-store"
        return response


def _token_payload(issued: IssuedTokens) -> dict:
    return {
        "token_type": "Bearer",
        "access_token": issued.access_token,
        "refresh_token": issued.refresh_token,
        "access_expires_at": issued.access_expires_at,
        "refresh_expires_at": issued.refresh_expires_at,
    }


def _no_store(response: Response) -> Response:
    response["Cache-Control"] = "no-store"
    return response


_token_response = inline_serializer(
    name="TokenEnvelope",
    fields={
        "data": inline_serializer(
            name="TokenPair",
            fields={
                "token_type": serializers.CharField(),
                "access_token": serializers.CharField(),
                "refresh_token": serializers.CharField(),
                "access_expires_at": serializers.DateTimeField(),
                "refresh_expires_at": serializers.DateTimeField(),
                "actor": serializers.DictField(),
            },
        )
    },
)


class TokenView(APIView):
    """Bearer sign-in for native clients: same credentials, same User, same audit
    trail as session login, but the result is a short-lived access token plus a
    rotating refresh token instead of a cookie."""

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []
    throttle_scope = "auth"

    @extend_schema(request=TokenRequestSerializer, responses=_token_response)
    def post(self, request: Request) -> Response:
        serializer = TokenRequestSerializer(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            _audit(user=None, action="LOGIN", outcome=AuditEvent.Outcome.FAILURE, request=request)
            raise
        user = serializer.validated_data["user"]
        issued = start_session(
            user=user,
            client="mobile",
            device_label=serializer.validated_data.get("device_label", ""),
        )
        _audit(user=user, action="LOGIN", outcome=AuditEvent.Outcome.SUCCESS, request=request)
        payload = _token_payload(issued)
        payload["actor"] = _context_payload(build_actor_context(user))
        return _no_store(Response({"data": payload}))


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []
    throttle_scope = "auth"

    def get_authenticate_header(self, request: Request) -> str:
        return "Bearer"  # makes a refused refresh a 401, not a 403

    @extend_schema(request=RefreshRequestSerializer, responses=_token_response)
    def post(self, request: Request) -> Response:
        serializer = RefreshRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            issued = rotate(serializer.validated_data["refresh_token"])
        except TokenError as exc:
            raise AuthenticationFailed(str(exc)) from exc
        return _no_store(Response({"data": _token_payload(issued)}))


class TokenRevokeView(APIView):
    """Sign out: revokes the session (and so every token in its family). Accepts
    the refresh token, or an authenticated bearer request, or both."""

    permission_classes = [AllowAny]
    throttle_scope = "auth"

    @extend_schema(request=RevokeRequestSerializer, responses={204: None})
    def post(self, request: Request) -> Response:
        serializer = RevokeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = request.auth if isinstance(request.auth, AuthSession) else None
        refresh = serializer.validated_data.get("refresh_token")
        if session is None and refresh:
            token = (
                AuthToken.objects.select_related("session")
                .filter(token_hash=hash_token(refresh), kind=AuthToken.Kind.REFRESH)
                .first()
            )
            session = token.session if token else None
        if session is not None:
            revoke_session(session, "LOGOUT")
            _audit(
                user=session.user,
                action="LOGOUT",
                outcome=AuditEvent.Outcome.SUCCESS,
                request=request,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)  # identical whether or not it matched


class TokenRevokeAllView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={204: None})
    def post(self, request: Request) -> Response:
        revoke_all_sessions(request.user, "LOGOUT_ALL")
        _audit(
            user=request.user,
            action="LOGOUT_ALL",
            outcome=AuditEvent.Outcome.SUCCESS,
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerRegistrationView(APIView):
    """Creates a CUSTOMER identity: no institution membership, no roles, and only
    the fields TAMVA needs (email, password, optional name, terms acceptance)."""

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []
    throttle_scope = "registration"

    @extend_schema(request=CustomerRegistrationSerializer, responses={201: None})
    def post(self, request: Request) -> Response:
        serializer = CustomerRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        email = data["email"].strip().lower()
        if (
            User.objects.filter(email__iexact=email).exists()
            or User.objects.filter(username__iexact=email).exists()
        ):
            # Deliberately generic: says nothing about which detail was the problem.
            raise ValidationError({"email": ["We couldn't create an account with these details."]})
        candidate = User(
            username=email,
            email=email,
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            identity_type=User.IdentityType.CUSTOMER,
        )
        try:
            validate_password(data["password"], candidate)
        except DjangoValidationError as exc:
            raise ValidationError({"password": list(exc.messages)}) from exc
        user = User.objects.create_user(
            username=email,
            email=email,
            password=data["password"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            identity_type=User.IdentityType.CUSTOMER,
        )
        _audit(
            user=user,
            action="CUSTOMER_REGISTERED",
            outcome=AuditEvent.Outcome.SUCCESS,
            request=request,
            metadata={"terms_accepted_at": timezone.now().isoformat()},
        )
        return Response(
            {"data": {"id": str(user.id), "email": user.email}}, status=status.HTTP_201_CREATED
        )


class RecoveryRequestView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []
    throttle_scope = "recovery"

    @extend_schema(request=RecoveryRequestSerializer, responses={202: None})
    def post(self, request: Request) -> Response:
        serializer = RecoveryRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_recovery(serializer.validated_data["email"])
        # Identical for known and unknown addresses.
        return Response({"data": {"status": "accepted"}}, status=status.HTTP_202_ACCEPTED)


class RecoveryConfirmView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []
    throttle_scope = "recovery"

    @extend_schema(request=RecoveryConfirmSerializer, responses={204: None})
    def post(self, request: Request) -> Response:
        serializer = RecoveryConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            confirm_recovery(
                serializer.validated_data["token"], serializer.validated_data["new_password"]
            )
        except TokenError as exc:
            raise ValidationError({"token": [str(exc)]}) from exc
        except DjangoValidationError as exc:
            raise ValidationError({"new_password": list(exc.messages)}) from exc
        return Response(status=status.HTTP_204_NO_CONTENT)
