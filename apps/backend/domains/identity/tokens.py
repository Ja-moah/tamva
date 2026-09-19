"""Native-friendly authentication: short-lived access tokens and rotating
refresh tokens, resolving to the same `User` as session auth.

Design (see docs/adr/ADR-013-customer-token-authentication.md):
- opaque random tokens, SHA-256 at rest, never logged;
- access token 15 minutes, refresh token 30 days;
- every refresh rotates the pair; reusing a spent refresh token revokes the
  whole session (token-family revocation);
- inactive/suspended users are refused at every step.
"""

from __future__ import annotations

import hashlib
import secrets
from dataclasses import dataclass
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from domains.audit.services import record_audit
from domains.identity.models import AuthSession, AuthToken, User

ACCESS_LIFETIME = timedelta(minutes=15)
REFRESH_LIFETIME = timedelta(days=30)


class TokenError(Exception):
    """Any refusal. The message is safe to show; it never says why a token failed."""


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class IssuedTokens:
    access_token: str
    refresh_token: str
    access_expires_at: object
    refresh_expires_at: object
    session: AuthSession


def user_may_authenticate(user: User) -> bool:
    return bool(user.is_active and user.status == "ACTIVE")


def _issue(session: AuthSession) -> IssuedTokens:
    now = timezone.now()
    access, refresh = secrets.token_urlsafe(32), secrets.token_urlsafe(48)
    access_expires, refresh_expires = now + ACCESS_LIFETIME, now + REFRESH_LIFETIME
    AuthToken.objects.bulk_create(
        [
            AuthToken(
                session=session,
                kind=AuthToken.Kind.ACCESS,
                token_hash=hash_token(access),
                expires_at=access_expires,
            ),
            AuthToken(
                session=session,
                kind=AuthToken.Kind.REFRESH,
                token_hash=hash_token(refresh),
                expires_at=refresh_expires,
            ),
        ]
    )
    return IssuedTokens(access, refresh, access_expires, refresh_expires, session)


@transaction.atomic
def start_session(*, user: User, client: str = "mobile", device_label: str = "") -> IssuedTokens:
    if not user_may_authenticate(user):
        raise TokenError("Authentication failed.")
    session = AuthSession.objects.create(
        user=user, client=client[:30], device_label=device_label[:100]
    )
    record_audit(action="TOKEN_SESSION_STARTED", actor=user, metadata={"client": session.client})
    return _issue(session)


def revoke_session(session: AuthSession, reason: str) -> None:
    if session.revoked_at is None:
        session.revoked_at = timezone.now()
        session.revoked_reason = reason
        session.save(update_fields=["revoked_at", "revoked_reason", "updated_at"])


def revoke_all_sessions(user: User, reason: str) -> int:
    now = timezone.now()
    return AuthSession.objects.filter(user=user, revoked_at__isnull=True).update(
        revoked_at=now, revoked_reason=reason
    )


def rotate(refresh_token: str) -> IssuedTokens:
    """Exchange a refresh token for a new pair. One use only."""
    with transaction.atomic():
        token = (
            AuthToken.objects.select_for_update()
            .select_related("session__user")
            .filter(token_hash=hash_token(refresh_token), kind=AuthToken.Kind.REFRESH)
            .first()
        )
        if token is None:
            raise TokenError("Authentication failed.")
        session = token.session
        if not session.is_active or not user_may_authenticate(session.user):
            raise TokenError("Authentication failed.")
        if token.used_at is not None:
            revoke_session(session, "REFRESH_REUSE")
            record_audit(
                action="TOKEN_REUSE_DETECTED",
                outcome="FAILURE",
                actor=session.user,
                metadata={"session_id": str(session.id)},
            )
            reuse = True
        elif token.expires_at <= timezone.now():
            raise TokenError("Authentication failed.")
        else:
            reuse = False
            token.used_at = timezone.now()
            token.save(update_fields=["used_at"])
            issued = _issue(session)
            session.last_used_at = timezone.now()
            session.save(update_fields=["last_used_at", "updated_at"])
    if reuse:
        raise TokenError("Authentication failed.")
    return issued


def resolve_access_token(access_token: str) -> tuple[User, AuthSession] | None:
    token = (
        AuthToken.objects.select_related("session__user")
        .filter(token_hash=hash_token(access_token), kind=AuthToken.Kind.ACCESS)
        .first()
    )
    if token is None or token.expires_at <= timezone.now():
        return None
    session = token.session
    if not session.is_active or not user_may_authenticate(session.user):
        return None
    return session.user, session


def purge_expired_tokens() -> int:
    """Housekeeping: drop tokens well past expiry (kept briefly so reuse of a
    just-expired refresh token is still detected as reuse, not as unknown)."""
    cutoff = timezone.now() - timedelta(days=7)
    deleted, _ = AuthToken.objects.filter(expires_at__lt=cutoff).delete()
    return deleted
