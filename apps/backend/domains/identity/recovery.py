"""Account recovery: non-disclosing request, single-use hashed token, and a
password reset that ends every existing session.

Delivery goes through Django's email framework (the provider boundary): tests
use the in-memory backend, deployments configure SMTP or a transactional-email
backend. The raw token exists only in the outgoing message.
"""

from __future__ import annotations

import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from domains.audit.services import record_audit
from domains.identity.models import RecoveryToken, User
from domains.identity.tokens import TokenError, hash_token, revoke_all_sessions

logger = logging.getLogger(__name__)


def request_recovery(email: str) -> None:
    """Never reveals whether the address is registered."""
    user = User.objects.filter(email__iexact=email.strip()).first()
    if user is None or not user.is_active or user.status != "ACTIVE":
        record_audit(action="RECOVERY_REQUESTED", outcome="FAILURE", metadata={"known": False})
        return
    token = secrets.token_urlsafe(32)
    with transaction.atomic():
        RecoveryToken.objects.filter(user=user, used_at__isnull=True).update(
            used_at=timezone.now()
        )  # a new request supersedes older links
        RecoveryToken.objects.create(
            user=user,
            token_hash=hash_token(token),
            expires_at=timezone.now() + timedelta(minutes=settings.RECOVERY_TOKEN_LIFETIME_MINUTES),
        )
        record_audit(action="RECOVERY_REQUESTED", actor=user, metadata={"known": True})
    try:
        _send_recovery_email(user, token)
    except Exception:
        # Not surfaced to the caller (it would reveal the account exists), but never
        # silent: operators see it. Neither the token nor the address is logged.
        logger.exception("recovery_email_delivery_failed", extra={"user_id": str(user.id)})


def _send_recovery_email(user: User, token: str) -> None:
    send_mail(
        subject="Reset your TAMVA password",
        message=(
            "Use this link to choose a new password. It expires soon and works once.\n\n"
            f"{settings.RECOVERY_LINK_BASE}?token={token}\n\n"
            "If you did not ask for this, you can ignore this message."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


@transaction.atomic
def confirm_recovery(token: str, new_password: str) -> User:
    record = (
        RecoveryToken.objects.select_for_update()
        .select_related("user")
        .filter(token_hash=hash_token(token))
        .first()
    )
    if (
        record is None
        or record.used_at is not None
        or record.expires_at <= timezone.now()
        or not record.user.is_active
        or record.user.status != "ACTIVE"
    ):
        raise TokenError("This recovery link is invalid or has expired.")
    validate_password(new_password, record.user)  # raises Django ValidationError
    record.used_at = timezone.now()
    record.save(update_fields=["used_at"])
    user = record.user
    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])
    revoke_all_sessions(user, "PASSWORD_RESET")
    record_audit(action="PASSWORD_RESET", actor=user)
    return user
