from uuid import UUID

from django.contrib.auth import login, logout
from django.core.exceptions import PermissionDenied
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from domains.audit.models import AuditEvent
from domains.identity.api.serializers import LoginSerializer
from domains.identity.models import User
from domains.identity.services import ActorContext, build_actor_context


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
