from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from domains.identity.services import user_has_permission


class HasPermission(BasePermission):
    message = "You do not have the required permission."

    def has_permission(self, request: Request, view: Any) -> bool:
        permission_code = getattr(view, "required_permission", None)
        if not permission_code:
            return False
        institution_id = request.headers.get("X-Institution-ID")
        return user_has_permission(request.user, permission_code, institution_id)
