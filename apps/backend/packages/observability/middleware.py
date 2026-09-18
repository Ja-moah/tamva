import uuid
from collections.abc import Callable

from django.http import HttpRequest, HttpResponse

from packages.observability.context import request_id_var, tenant_id_var, user_id_var


class RequestContextMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request_id = request.headers.get("X-Request-ID", "").strip()[:128] or str(uuid.uuid4())
        request.request_id = request_id  # type: ignore[attr-defined]
        request_token = request_id_var.set(request_id)
        tenant_token = tenant_id_var.set("")
        user_token = user_id_var.set("")
        try:
            response = self.get_response(request)
            response["X-Request-ID"] = request_id
            return response
        finally:
            request_id_var.reset(request_token)
            tenant_id_var.reset(tenant_token)
            user_id_var.reset(user_token)
