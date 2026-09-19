from __future__ import annotations

from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request

from domains.identity.models import User


class IsCustomerActor(BasePermission):
    """An authenticated, active CUSTOMER. Institutional actors are not customers,
    and customer-owned endpoints never widen institutional RBAC."""

    message = "This resource is only available to customers."

    def has_permission(self, request: Request, view: Any) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and getattr(user, "status", "") == "ACTIVE"
            and getattr(user, "identity_type", "") == User.IdentityType.CUSTOMER
        )
