from uuid import UUID

from django.core.exceptions import PermissionDenied
from rest_framework.request import Request


def institution_id_from_request(request: Request) -> UUID | None:
    value = request.headers.get("X-Institution-ID")
    if not value:
        return None
    try:
        return UUID(value)
    except ValueError as exc:
        raise PermissionDenied("X-Institution-ID must be a valid UUID.") from exc


def require_institution_id(request: Request) -> UUID:
    institution_id = institution_id_from_request(request)
    if institution_id is None:
        raise PermissionDenied("X-Institution-ID header is required.")
    return institution_id
