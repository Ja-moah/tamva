from uuid import UUID

from django.contrib.auth import login, logout
from django.core.exceptions import PermissionDenied
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditEvent
from apps.identity.api.serializers import LoginSerializer
from apps.identity.models import User
from apps.identity.services import ActorContext, build_actor_context


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

    def post(self, request: Request) -> Response:
        request.session.cycle_key()
        context = build_actor_context(request.user, _institution_id(request))
        return Response({"data": _context_payload(context)})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

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

    def get(self, request: Request) -> Response:
        context = build_actor_context(request.user, _institution_id(request))
        return Response({"data": _context_payload(context)})
