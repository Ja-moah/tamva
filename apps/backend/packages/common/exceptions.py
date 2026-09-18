from typing import Any

from rest_framework.response import Response
from rest_framework.views import exception_handler

from packages.observability.context import request_id_var


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = exception_handler(exc, context)
    if response is None:
        return None
    message = "Request validation failed" if response.status_code == 400 else "Request failed"
    response.data = {
        "error": {
            "code": getattr(exc, "default_code", "api_error"),
            "message": message,
            "request_id": request_id_var.get(),
            "details": response.data,
        }
    }
    return response
