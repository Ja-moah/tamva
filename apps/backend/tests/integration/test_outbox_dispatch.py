from unittest.mock import patch

import pytest
from django.utils import timezone

from domains.notifications.models import NotificationEventBinding, NotificationTemplate
from packages.events.models import OutboxEvent
from packages.events.tasks import MAX_ATTEMPTS, dispatch_pending_outbox_events
from tests.integration.test_case import block_risk_event, open_case_from_event_helper


@pytest.mark.integration
@pytest.mark.django_db
def test_dispatch_processes_pending_case_created_event(normalisation_context):
    risk_event = block_risk_event(normalisation_context)
    open_case_from_event_helper(risk_event, normalisation_context[1])
    template = NotificationTemplate.objects.create(
        code="outbox-dispatch-test",
        version="1",
        category="CASE",
        channel="IN_APP",
        provider_code="in_app_reference_v1",
        body_template="Case $case_id opened.",
    )
    NotificationEventBinding.objects.create(event_type="case.created", template=template)
    event = OutboxEvent.objects.get(
        event_type="case.created", tenant_id=normalisation_context[1].id
    )
    assert event.published_at is None

    dispatched = dispatch_pending_outbox_events()

    assert dispatched == 1
    event.refresh_from_db()
    assert event.published_at is not None
    assert event.attempts == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_dispatch_does_not_reprocess_already_published_events(normalisation_context):
    risk_event = block_risk_event(normalisation_context)
    open_case_from_event_helper(risk_event, normalisation_context[1])

    first = dispatch_pending_outbox_events()
    second = dispatch_pending_outbox_events()

    assert first == 1
    assert second == 0


@pytest.mark.integration
@pytest.mark.django_db
def test_dispatch_ignores_unrouted_event_types(normalisation_context):
    event = OutboxEvent.objects.create(
        event_type="something.unrouted",
        occurred_at=timezone.now(),
        producer="test",
        tenant_id=normalisation_context[1].id,
        payload={},
    )

    dispatched = dispatch_pending_outbox_events()

    assert dispatched == 0
    event.refresh_from_db()
    assert event.published_at is None


@pytest.mark.integration
@pytest.mark.django_db
def test_dispatch_dead_letters_after_max_attempts(normalisation_context):
    risk_event = block_risk_event(normalisation_context)
    open_case_from_event_helper(risk_event, normalisation_context[1])
    event = OutboxEvent.objects.get(
        event_type="case.created", tenant_id=normalisation_context[1].id
    )

    with patch("packages.events.tasks.process_outbox_event", side_effect=RuntimeError("boom")):
        for expected_attempts in range(1, MAX_ATTEMPTS + 1):
            dispatch_pending_outbox_events()
            event.refresh_from_db()
            assert event.attempts == expected_attempts
            if expected_attempts < MAX_ATTEMPTS:
                assert event.published_at is None
            assert event.last_error == "RuntimeError"

    assert event.published_at is not None  # dead-lettered: stopped, not lost

    # A dead-lettered event is never picked up again.
    with patch("packages.events.tasks.process_outbox_event") as mock_process:
        dispatch_pending_outbox_events()
    mock_process.assert_not_called()
