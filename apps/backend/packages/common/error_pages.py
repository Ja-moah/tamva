"""JSON error responses for failures raised outside DRF views (unmatched URLs, CSRF,
unhandled exceptions), so API clients never receive an HTML error page or a stack
trace. Same envelope as `api_exception_handler`."""

from django.http import HttpRequest, JsonResponse

from packages.observability.context import request_id_var


def _envelope(status: int, code: str, message: str) -> JsonResponse:
    return JsonResponse(
        {"error": {"code": code, "message": message, "request_id": request_id_var.get()}},
        status=status,
    )


def bad_request(request: HttpRequest, exception: Exception | None = None) -> JsonResponse:
    return _envelope(400, "bad_request", "Request failed")


def permission_denied(request: HttpRequest, exception: Exception | None = None) -> JsonResponse:
    return _envelope(403, "permission_denied", "Request failed")


def not_found(request: HttpRequest, exception: Exception | None = None) -> JsonResponse:
    return _envelope(404, "not_found", "Not found")


def server_error(request: HttpRequest) -> JsonResponse:
    return _envelope(500, "server_error", "Something went wrong. Quote the request id to support.")
