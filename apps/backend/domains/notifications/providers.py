from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

from django.core.exceptions import ValidationError

from .models import Notification


@dataclass(frozen=True)
class NotificationSendResult:
    success: bool
    result_code: str
    metadata: dict[str, Any] = field(default_factory=dict)


class NotificationProvider(Protocol):
    """Execution boundary between the domain and any delivery mechanism.

    Business code depends on this interface only, never on a specific email,
    SMS, or push vendor SDK.
    """

    code: str

    def send(self, *, notification: Notification) -> NotificationSendResult: ...


class InAppNotificationProvider:
    """Reference in-app provider: delivery is simply persisting the record."""

    code = "in_app_reference_v1"

    def send(self, *, notification: Notification) -> NotificationSendResult:
        return NotificationSendResult(
            success=True, result_code="STORED", metadata={"provider": self.code}
        )


class DeterministicMockEmailProvider:
    """Development/reference provider. Never calls a real email vendor."""

    code = "deterministic_mock_email_v1"

    def send(self, *, notification: Notification) -> NotificationSendResult:
        return NotificationSendResult(
            success=True,
            result_code="MOCK_SENT",
            metadata={"provider": self.code, "reference_only": True},
        )


_PROVIDERS: dict[str, NotificationProvider] = {}


def register_provider(provider: NotificationProvider) -> None:
    _PROVIDERS[provider.code] = provider


def get_provider(code: str) -> NotificationProvider:
    try:
        return _PROVIDERS[code]
    except KeyError as exc:
        raise ValidationError(f"Unknown notification provider: {code}") from exc


register_provider(InAppNotificationProvider())
register_provider(DeterministicMockEmailProvider())
