import logging
import re
import time
import uuid
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

from packages.observability.context import request_id_var, tenant_id_var, user_id_var

# The wire version clients are speaking; bumped only with a breaking /api/vN change.
API_VERSION = "1"

logger = logging.getLogger("tamva.request")
# Client-supplied trace ids are echoed and logged, so accept only a safe shape.
_REQUEST_ID = re.compile(r"^[A-Za-z0-9._:\-]{1,128}$")
_QUIET_PREFIXES = ("/health/",)  # probes hit these every few seconds


def _request_id_for(request: HttpRequest) -> str:
    supplied = request.headers.get("X-Request-ID", "").strip()
    return supplied if _REQUEST_ID.fullmatch(supplied) else str(uuid.uuid4())


class RequestContextMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request_id = _request_id_for(request)
        request.request_id = request_id  # type: ignore[attr-defined]
        request_token = request_id_var.set(request_id)
        tenant_token = tenant_id_var.set("")
        user_token = user_id_var.set("")
        started = time.monotonic()
        try:
            response = self.get_response(request)
            response["X-Request-ID"] = request_id
            response["X-API-Version"] = API_VERSION
            self._log_completion(request, response.status_code, started)
            return response
        finally:
            request_id_var.reset(request_token)
            tenant_id_var.reset(tenant_token)
            user_id_var.reset(user_token)

    @staticmethod
    def _log_completion(request: HttpRequest, status_code: int, started: float) -> None:
        """One line per request. The path is logged without its query string, because
        query strings can carry one-time tokens (export downloads)."""
        level = logging.DEBUG if request.path.startswith(_QUIET_PREFIXES) else logging.INFO
        if not logger.isEnabledFor(level):
            return
        user = getattr(request, "user", None)
        user_id = (
            str(user.id) if user is not None and getattr(user, "is_authenticated", False) else ""
        )
        logger.log(
            level,
            "request_completed",
            extra={
                "event": "request_completed",
                "method": request.method,
                "path": request.path,
                "status": status_code,
                "duration_ms": round((time.monotonic() - started) * 1000, 1),
                "user_id": user_id,
                "tenant_id": request.headers.get("X-Institution-ID", "").strip()[:64],
            },
        )


class TenantContextMiddleware:
    """Populates tenant_id/user_id for structured logs once auth has run.

    Must sit after AuthenticationMiddleware in MIDDLEWARE so request.user is
    already resolved. The institution ID is read directly from the request
    header for log correlation only — it is not an authorization decision;
    each view/permission class still enforces membership independently.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        user = getattr(request, "user", None)
        user_id = (
            str(user.id) if user is not None and getattr(user, "is_authenticated", False) else ""
        )
        institution_id = request.headers.get("X-Institution-ID", "").strip()[:64]
        user_token = user_id_var.set(user_id)
        tenant_token = tenant_id_var.set(institution_id)
        try:
            return self.get_response(request)
        finally:
            user_id_var.reset(user_token)
            tenant_id_var.reset(tenant_token)
