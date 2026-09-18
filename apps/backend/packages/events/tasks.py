from __future__ import annotations

import logging

from django.db import transaction
from django.utils import timezone

from config.celery import app
from domains.notifications.services import process_outbox_event

from .models import OutboxEvent

logger = logging.getLogger(__name__)

# event_type values this worker knows how to route. Anything else is left
# untouched (published_at stays null) rather than being silently marked
# handled by a consumer that never actually looked at it.
NOTIFICATION_EVENT_TYPES = frozenset(
    {"case.created", "case.assigned", "case.status_changed", "case.resolved"}
)

MAX_ATTEMPTS = 5


@app.task(bind=True, acks_late=True)
def dispatch_pending_outbox_events(self: object, batch_size: int = 100) -> int:
    """Process unpublished OutboxEvent rows this worker knows how to route.

    Safe for multiple concurrent workers: rows are claimed with
    select_for_update(skip_locked=True), and the downstream consumer
    (process_outbox_event) is idempotent per
    (event, template, channel, recipient), so re-processing after a crash
    mid-batch never duplicates a notification.

    An event that keeps failing is dead-lettered after MAX_ATTEMPTS: marked
    published (so it stops being picked up) but with its error preserved on
    the row for operator investigation and manual replay, rather than
    retried forever or silently dropped.
    """
    dispatched = 0
    with transaction.atomic():
        events = list(
            OutboxEvent.objects.select_for_update(skip_locked=True)
            .filter(published_at__isnull=True, event_type__in=NOTIFICATION_EVENT_TYPES)
            .order_by("occurred_at")[:batch_size]
        )
        for event in events:
            try:
                process_outbox_event(event=event)
            except Exception as exc:
                event.attempts += 1
                event.last_error = type(exc).__name__
                update_fields = ["attempts", "last_error"]
                if event.attempts >= MAX_ATTEMPTS:
                    event.published_at = timezone.now()
                    update_fields.append("published_at")
                    logger.error(
                        "outbox_event_dead_lettered",
                        extra={
                            "event": "outbox_event_dead_lettered",
                            "outbox_event_id": str(event.id),
                            "event_type": event.event_type,
                        },
                    )
                event.save(update_fields=update_fields)
                continue
            dispatched += 1
    return dispatched
