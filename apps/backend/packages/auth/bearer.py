from __future__ import annotations

from typing import Any

from rest_framework import authentication, exceptions
from rest_framework.request import Request

from domains.identity.tokens import resolve_access_token


class BearerTokenAuthentication(authentication.BaseAuthentication):
    """`Authorization: Bearer <access token>`. Resolves to the same User as
    session auth, so RBAC and ownership checks are identical for every client.
    Bearer requests carry no ambient credential, so CSRF does not apply."""

    keyword = "Bearer"

    def authenticate(self, request: Request) -> tuple[Any, Any] | None:
        header = authentication.get_authorization_header(request).split()
        if not header or header[0].lower() != self.keyword.lower().encode():
            return None
        if len(header) != 2:
            raise exceptions.AuthenticationFailed("Invalid credentials.")
        try:
            resolved = resolve_access_token(header[1].decode())
        except UnicodeError as exc:
            raise exceptions.AuthenticationFailed("Invalid credentials.") from exc
        if resolved is None:
            raise exceptions.AuthenticationFailed("Invalid or expired credentials.")
        user, session = resolved
        return user, session

    def authenticate_header(self, request: Request) -> str:
        return self.keyword
