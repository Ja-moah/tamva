import pytest
from django.core.exceptions import PermissionDenied
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.case.models import Case
from domains.case.services import assign_case
from domains.notifications.models import (
    Notification,
    NotificationChannel,
    NotificationDeliveryAttempt,
    NotificationEventBinding,
    NotificationPreference,
    NotificationTemplate,
)
from domains.notifications.providers import NotificationSendResult, register_provider
from domains.notifications.services import process_outbox_event
from packages.events.models import OutboxEvent
from tests.integration.test_case import block_risk_event, open_case_from_event_helper, platform_user


def latest_event(event_type, institution):
    return (
        OutboxEvent.objects.filter(event_type=event_type, tenant_id=institution.id)
        .order_by("-created_at")
        .first()
    )


def make_template(
    *,
    code="case_created",
    version="1",
    channel=NotificationChannel.IN_APP,
    provider_code="in_app_reference_v1",
    category="CASE",
    mandatory=False,
    subject="Case update",
    body="Case $case_id was updated.",
):
    return NotificationTemplate.objects.create(
        code=code,
        version=version,
        category=category,
        channel=channel,
        provider_code=provider_code,
        subject_template=subject,
        body_template=body,
        mandatory=mandatory,
    )


def bind(template, event_type):
    return NotificationEventBinding.objects.create(event_type=event_type, template=template)


def open_case(context):
    risk_event = block_risk_event(context)
    return open_case_from_event_helper(risk_event, context[1])


@pytest.mark.integration
@pytest.mark.django_db
def test_case_created_event_produces_notification(normalisation_context):
    case = open_case(normalisation_context)
    event = latest_event("case.created", normalisation_context[1])
    template = make_template()
    bind(template, "case.created")

    notifications = process_outbox_event(event=event)

    assert len(notifications) == 1
    notification = notifications[0]
    assert notification.recipient_id == case.customer_id
    assert notification.body == f"Case {case.id} was updated."
    assert notification.status == Notification.Status.SENT


@pytest.mark.integration
@pytest.mark.django_db
def test_case_assigned_notifies_correct_tenant_safe_recipient(normalisation_context):
    case = open_case(normalisation_context)
    handler = platform_user(normalisation_context, username="assignee-1")
    assign_case(
        case=case, assignee=handler, assigned_by=handler, institution=normalisation_context[1]
    )
    event = latest_event("case.assigned", normalisation_context[1])
    template = make_template(code="case_assigned", category="CASE")
    bind(template, "case.assigned")

    notifications = process_outbox_event(event=event)

    assert len(notifications) == 1
    assert notifications[0].recipient_id == handler.id


@pytest.mark.integration
@pytest.mark.django_db
def test_case_resolved_generates_notification(normalisation_context):
    case = open_case(normalisation_context)
    handler = platform_user(normalisation_context, username="resolver-1")
    from domains.case.models import CaseResolution
    from domains.case.services import resolve_case, transition_case_status

    transition_case_status(
        case=case,
        new_status=Case.Status.TRIAGED,
        institution=normalisation_context[1],
        actor=handler,
    )
    transition_case_status(
        case=case,
        new_status=Case.Status.INVESTIGATING,
        institution=normalisation_context[1],
        actor=handler,
    )
    transition_case_status(
        case=case,
        new_status=Case.Status.ACTIONED,
        institution=normalisation_context[1],
        actor=handler,
    )
    resolve_case(
        case=case,
        outcome=CaseResolution.Outcome.CONFIRMED_RISK,
        reason="Confirmed.",
        resolved_by=handler,
        institution=normalisation_context[1],
    )
    event = latest_event("case.resolved", normalisation_context[1])
    template = make_template(code="case_resolved")
    bind(template, "case.resolved")

    notifications = process_outbox_event(event=event)

    assert len(notifications) == 1
    assert notifications[0].status == Notification.Status.SENT


@pytest.mark.integration
@pytest.mark.django_db
def test_duplicate_business_event_is_idempotent(normalisation_context):
    open_case(normalisation_context)
    event = latest_event("case.created", normalisation_context[1])
    template = make_template()
    bind(template, "case.created")

    first = process_outbox_event(event=event)
    second = process_outbox_event(event=event)

    assert len(first) == 1
    assert len(second) == 1
    assert first[0].id == second[0].id
    assert Notification.objects.filter(source_event=event).count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_disabled_optional_channel_is_skipped(normalisation_context):
    case = open_case(normalisation_context)
    template = make_template(mandatory=False)
    bind(template, "case.created")
    NotificationPreference.objects.create(
        customer=case.customer, category="CASE", channel=NotificationChannel.IN_APP, enabled=False
    )
    event = latest_event("case.created", normalisation_context[1])

    notifications = process_outbox_event(event=event)

    assert notifications[0].status == Notification.Status.SKIPPED
    assert not notifications[0].delivery_attempts.exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_mandatory_template_ignores_disabled_preference(normalisation_context):
    case = open_case(normalisation_context)
    template = make_template(mandatory=True)
    bind(template, "case.created")
    NotificationPreference.objects.create(
        customer=case.customer, category="CASE", channel=NotificationChannel.IN_APP, enabled=False
    )
    event = latest_event("case.created", normalisation_context[1])

    notifications = process_outbox_event(event=event)

    assert notifications[0].status == Notification.Status.SENT


@pytest.mark.integration
@pytest.mark.django_db
def test_provider_success_marks_sent_with_attempt(normalisation_context):
    open_case(normalisation_context)
    template = make_template()
    bind(template, "case.created")
    event = latest_event("case.created", normalisation_context[1])

    notification = process_outbox_event(event=event)[0]

    assert notification.status == Notification.Status.SENT
    attempt = notification.delivery_attempts.get()
    assert attempt.status == NotificationDeliveryAttempt.Status.SENT
    assert attempt.provider_code == "in_app_reference_v1"


@pytest.mark.integration
@pytest.mark.django_db
def test_provider_failure_is_recorded_explicitly(normalisation_context):
    class FailingProvider:
        code = "failing_notification_provider"

        def send(self, *, notification):
            return NotificationSendResult(
                success=False, result_code="TRANSIENT_FAILURE", metadata={}
            )

    register_provider(FailingProvider())
    open_case(normalisation_context)
    template = make_template(provider_code="failing_notification_provider")
    bind(template, "case.created")
    event = latest_event("case.created", normalisation_context[1])

    notification = process_outbox_event(event=event)[0]

    assert notification.status == Notification.Status.FAILED
    attempt = notification.delivery_attempts.get()
    assert attempt.status == NotificationDeliveryAttempt.Status.FAILED
    assert attempt.result_code == "TRANSIENT_FAILURE"


@pytest.mark.integration
@pytest.mark.django_db
def test_provider_error_is_sanitized(normalisation_context):
    class ExplodingProvider:
        code = "exploding_notification_provider"

        def send(self, *, notification):
            raise RuntimeError("leaked secret credential details")

    register_provider(ExplodingProvider())
    open_case(normalisation_context)
    template = make_template(provider_code="exploding_notification_provider")
    bind(template, "case.created")
    event = latest_event("case.created", normalisation_context[1])

    notification = process_outbox_event(event=event)[0]

    assert notification.status == Notification.Status.FAILED
    attempt = notification.delivery_attempts.get()
    assert attempt.result_code == "PROVIDER_ERROR"
    assert attempt.metadata == {"error_type": "RuntimeError"}


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_tenant_recipient_is_denied(normalisation_context):
    other_institution = normalisation_context[2]
    outsider = platform_user(
        normalisation_context, username="cross-tenant-user", institution=other_institution
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


@pytest.mark.integration
@pytest.mark.django_db
def test_template_version_change_creates_new_notification_provenance(normalisation_context):
    open_case(normalisation_context)
    event = latest_event("case.created", normalisation_context[1])
    first_template = make_template(version="1")
    bind(first_template, "case.created")
    first = process_outbox_event(event=event)[0]

    second_template = make_template(version="2")
    bind(second_template, "case.created")
    second_notifications = process_outbox_event(event=event)
    second = next(n for n in second_notifications if n.template_id == second_template.id)

    assert first.template_id != second.template_id
    assert first.id != second.id


@pytest.mark.integration
@pytest.mark.django_db
def test_historical_notification_is_immutable(normalisation_context):
    open_case(normalisation_context)
    template = make_template()
    bind(template, "case.created")
    event = latest_event("case.created", normalisation_context[1])

    notification = process_outbox_event(event=event)[0]
    original_body = notification.body
    original_status = notification.status

    # Reprocessing the same event must reuse, not mutate, the notification.
    process_outbox_event(event=event)

    notification.refresh_from_db()
    assert notification.body == original_body
    assert notification.status == original_status


@pytest.mark.integration
@pytest.mark.django_db
def test_delivery_attempts_are_preserved(normalisation_context):
    open_case(normalisation_context)
    template = make_template()
    bind(template, "case.created")
    event = latest_event("case.created", normalisation_context[1])

    notification = process_outbox_event(event=event)[0]

    assert notification.delivery_attempts.count() == 1
    assert notification.delivery_attempts.get().attempt_number == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_audit_trail_is_complete(normalisation_context):
    open_case(normalisation_context)
    template = make_template()
    bind(template, "case.created")
    event = latest_event("case.created", normalisation_context[1])

    notification = process_outbox_event(event=event)[0]

    actions = set(
        AuditEvent.objects.filter(metadata__notification_id=str(notification.id)).values_list(
            "action", flat=True
        )
    )
    assert {"NOTIFICATION_CREATED", "NOTIFICATION_DELIVERED"} <= actions
