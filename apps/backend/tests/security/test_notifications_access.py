import pytest
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from domains.notifications.services import process_outbox_event
from packages.events.models import OutboxEvent
from tests.integration.test_case import platform_user


@pytest.mark.security
@pytest.mark.django_db
def test_notification_recipient_must_belong_to_event_institution(normalisation_context) -> None:
    other_institution = normalisation_context[2]
    outsider = platform_user(
        normalisation_context, username="notif-cross-tenant", institution=other_institution
    )
    event = OutboxEvent.objects.create(
        event_type="case.assigned",
        occurred_at=timezone.now(),
        producer="domains.case",
        tenant_id=normalisation_context[1].id,
        payload={"case_id": "irrelevant", "assignee_id": str(outsider.id)},
    )

    with pytest.raises(PermissionDenied):
        process_outbox_event(event=event)
