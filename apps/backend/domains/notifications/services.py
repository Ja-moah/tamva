from __future__ import annotations

import hashlib
import json
from string import Template
from typing import Any

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.case.models import Case
from domains.identity.models import User
from domains.partner.models import InstitutionMembership
from packages.events.models import OutboxEvent

from .models import (
    Notification,
    NotificationDeliveryAttempt,
    NotificationEventBinding,
    NotificationPreference,
    NotificationTemplate,
)
from .providers import get_provider

_CASE_CUSTOMER_EVENTS = {"case.created", "case.status_changed", "case.resolved"}
_CASE_ASSIGNEE_EVENTS = {"case.assigned"}


def _resolve_recipient(event: OutboxEvent) -> User | None:
    if event.event_type in _CASE_ASSIGNEE_EVENTS:
        assignee_id = event.payload.get("assignee_id")
        if not assignee_id or event.tenant_id is None:
            return None
        recipient = User.objects.filter(id=assignee_id).first()
        if recipient is None:
            return None
        if not InstitutionMembership.objects.filter(
            institution_id=event.tenant_id, user=recipient, status="ACTIVE"
        ).exists():
            raise PermissionDenied(
                "Notification recipient is not a member of the event's institution."
            )
        return recipient

    if event.event_type in _CASE_CUSTOMER_EVENTS:
        case_id = event.payload.get("case_id")
        if not case_id:
            return None
        case = Case.objects.filter(id=case_id).first()
        if case is None:
            return None
        if case.institution_id != event.tenant_id:
            raise PermissionDenied("Case does not belong to the event's institution.")
        return case.customer

    return None


def _fingerprint(*, event: OutboxEvent, template: NotificationTemplate, recipient: User) -> str:
    payload = {
        "event_id": str(event.id),
        "template_id": str(template.id),
        "channel": template.channel,
        "recipient_id": str(recipient.id),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _render(template_str: str, context: dict[str, Any]) -> str:
    # string.Template only substitutes $-placeholders; it cannot execute code
    # or access attributes, unlike str.format() on untrusted templates.
    return Template(template_str).safe_substitute({k: str(v) for k, v in context.items()})


def _channel_allowed(*, recipient: User, template: NotificationTemplate) -> bool:
    if template.mandatory:
        return True
    preference = NotificationPreference.objects.filter(
        customer=recipient, category=template.category, channel=template.channel
    ).first()
    if preference is None:
        return True
    return preference.enabled


def _attempt_delivery(notification: Notification) -> None:
    provider = get_provider(notification.template.provider_code)
    attempt_number = notification.delivery_attempts.count() + 1
    notification.status = Notification.Status.SENDING
    notification.save(update_fields=["status", "updated_at"])
    try:
        result = provider.send(notification=notification)
    except Exception as exc:
        NotificationDeliveryAttempt.objects.create(
            notification=notification,
            provider_code=notification.template.provider_code,
            attempt_number=attempt_number,
            status=NotificationDeliveryAttempt.Status.FAILED,
            result_code="PROVIDER_ERROR",
            metadata={"error_type": type(exc).__name__},
        )
        notification.status = Notification.Status.FAILED
        notification.save(update_fields=["status", "updated_at"])
        AuditEvent.objects.create(
            institution=notification.institution,
            action="NOTIFICATION_DELIVERY_FAILED",
            outcome=AuditEvent.Outcome.FAILURE,
            metadata={"notification_id": str(notification.id), "result_code": "PROVIDER_ERROR"},
        )
        return

    NotificationDeliveryAttempt.objects.create(
        notification=notification,
        provider_code=notification.template.provider_code,
        attempt_number=attempt_number,
        status=(
            NotificationDeliveryAttempt.Status.SENT
            if result.success
            else NotificationDeliveryAttempt.Status.FAILED
        ),
        result_code=result.result_code,
        metadata=result.metadata,
    )
    notification.status = Notification.Status.SENT if result.success else Notification.Status.FAILED
    notification.save(update_fields=["status", "updated_at"])
    AuditEvent.objects.create(
        institution=notification.institution,
        action="NOTIFICATION_DELIVERED" if result.success else "NOTIFICATION_DELIVERY_FAILED",
        outcome=AuditEvent.Outcome.SUCCESS if result.success else AuditEvent.Outcome.FAILURE,
        metadata={"notification_id": str(notification.id), "result_code": result.result_code},
    )


@transaction.atomic
def _create_notification(
    *, event: OutboxEvent, template: NotificationTemplate, recipient: User
) -> Notification:
    fingerprint = _fingerprint(event=event, template=template, recipient=recipient)
    existing = Notification.objects.filter(
        source_event=event,
        template=template,
        channel=template.channel,
        recipient=recipient,
        source_fingerprint=fingerprint,
    ).first()
    if existing:
        return existing

    if not _channel_allowed(recipient=recipient, template=template):
        notification = Notification.objects.create(
            institution_id=event.tenant_id,
            recipient=recipient,
            template=template,
            channel=template.channel,
            source_event=event,
            source_fingerprint=fingerprint,
            status=Notification.Status.SKIPPED,
        )
        AuditEvent.objects.create(
            institution_id=event.tenant_id,
            action="NOTIFICATION_SKIPPED",
            outcome=AuditEvent.Outcome.SUCCESS,
            metadata={"notification_id": str(notification.id), "reason": "PREFERENCE_DISABLED"},
        )
        return notification

    context = {**event.payload, "event_type": event.event_type}
    notification = Notification.objects.create(
        institution_id=event.tenant_id,
        recipient=recipient,
        template=template,
        channel=template.channel,
        source_event=event,
        source_fingerprint=fingerprint,
        subject=_render(template.subject_template, context),
        body=_render(template.body_template, context),
        status=Notification.Status.PENDING,
    )
    AuditEvent.objects.create(
        institution_id=event.tenant_id,
        action="NOTIFICATION_CREATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"notification_id": str(notification.id), "event_type": event.event_type},
    )
    _attempt_delivery(notification)
    return notification


def process_outbox_event(*, event: OutboxEvent) -> list[Notification]:
    recipient = _resolve_recipient(event)
    if recipient is None:
        event.published_at = timezone.now()
        event.attempts += 1
        event.save(update_fields=["published_at", "attempts"])
        return []

    bindings = NotificationEventBinding.objects.filter(
        event_type=event.event_type, active=True, template__active=True
    ).select_related("template")
    notifications = [
        _create_notification(event=event, template=binding.template, recipient=recipient)
        for binding in bindings
    ]
    event.published_at = timezone.now()
    event.attempts += 1
    event.save(update_fields=["published_at", "attempts"])
    return notifications


def mark_notification_read(*, notification: Notification, recipient: User) -> Notification:
    if notification.recipient_id != recipient.id:
        raise PermissionDenied("Notification does not belong to the requesting user.")
    if notification.read_at is None:
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at", "updated_at"])
    return notification


BULK_READ_LIMIT = 200


def bulk_mark_notifications_read(*, recipient: User, notification_ids: list[Any]) -> dict[str, int]:
    """Mark the recipient's own notifications read. Ids that are not theirs are
    counted as not found, never as an error that reveals another user's data."""
    ids = list(dict.fromkeys(str(pk) for pk in notification_ids))
    if len(ids) > BULK_READ_LIMIT:
        raise ValidationError(f"At most {BULK_READ_LIMIT} notifications per request.")
    owned = Notification.objects.filter(recipient=recipient, id__in=ids)
    updated = owned.filter(read_at__isnull=True).update(read_at=timezone.now())
    matched = owned.count()
    return {
        "requested": len(ids),
        "marked_read": updated,
        "already_read": matched - updated,
        "not_found": len(ids) - matched,
    }
