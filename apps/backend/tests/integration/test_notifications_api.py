import pytest

from domains.notifications.models import NotificationEventBinding, NotificationTemplate
from domains.notifications.services import process_outbox_event
from packages.events.models import OutboxEvent
from tests.integration.test_case import block_risk_event, open_case_from_event_helper


def make_notification(context):
    risk_event = block_risk_event(context)
    open_case_from_event_helper(risk_event, context[1])
    event = (
        OutboxEvent.objects.filter(event_type="case.created", tenant_id=context[1].id)
        .order_by("-created_at")
        .first()
    )
    template = NotificationTemplate.objects.create(
        code="api-test-notification",
        version="1",
        category="CASE",
        channel="IN_APP",
        provider_code="in_app_reference_v1",
        body_template="Case $case_id",
    )
    NotificationEventBinding.objects.create(event_type="case.created", template=template)
    return process_outbox_event(event=event)[0]


@pytest.mark.integration
@pytest.mark.django_db
def test_unauthenticated_request_is_rejected(api_client) -> None:
    response = api_client.get("/api/v1/notifications/")
    assert response.status_code in {401, 403}


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_can_list_and_mark_own_notification_read(
    api_client, normalisation_context
) -> None:
    notification = make_notification(normalisation_context)
    api_client.force_authenticate(user=normalisation_context[0])

    list_response = api_client.get("/api/v1/notifications/")
    assert list_response.status_code == 200
    assert list_response.data["results"][0]["id"] == str(notification.id)
    assert list_response.data["results"][0]["read_at"] is None

    read_response = api_client.post(f"/api/v1/notifications/{notification.id}/read/")
    assert read_response.status_code == 200
    assert read_response.data["data"]["read_at"] is not None


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_cannot_read_another_customers_notification(
    api_client, normalisation_context
) -> None:
    notification = make_notification(normalisation_context)

    from domains.identity.models import User

    other_customer = User.objects.create_user(
        username="notif-other-customer",
        email="notif-other-customer@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.CUSTOMER,
    )
    api_client.force_authenticate(user=other_customer)

    response = api_client.get(f"/api/v1/notifications/{notification.id}/")
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_can_set_notification_preference(api_client, normalisation_context) -> None:
    api_client.force_authenticate(user=normalisation_context[0])

    response = api_client.post(
        "/api/v1/notification-preferences/",
        {"category": "CASE", "channel": "IN_APP", "enabled": False},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["data"]["enabled"] is False
