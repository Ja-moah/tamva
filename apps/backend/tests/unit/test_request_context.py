import uuid

import pytest
from django.contrib.auth.models import AnonymousUser
from django.http import HttpResponse
from django.test import RequestFactory
from django.urls import reverse

from domains.identity.models import User
from packages.observability.context import tenant_id_var, user_id_var
from packages.observability.middleware import TenantContextMiddleware


@pytest.mark.unit
@pytest.mark.django_db
def test_request_id_is_generated(api_client) -> None:
    response = api_client.get(reverse("health"))
    assert response["X-Request-ID"]


@pytest.mark.unit
@pytest.mark.django_db
def test_supplied_request_id_is_returned(api_client) -> None:
    response = api_client.get(reverse("health"), HTTP_X_REQUEST_ID="trace-123")
    assert response["X-Request-ID"] == "trace-123"


@pytest.mark.unit
def test_tenant_context_middleware_populates_authenticated_user() -> None:
    captured: dict[str, str] = {}

    def get_response(request: object) -> HttpResponse:
        captured["user_id"] = user_id_var.get()
        captured["tenant_id"] = tenant_id_var.get()
        return HttpResponse()

    institution_id = str(uuid.uuid4())
    user = User(
        id=uuid.uuid4(),
        username="probe",
        email="probe@example.test",
        identity_type=User.IdentityType.PLATFORM_USER,
    )
    request = RequestFactory().get("/", HTTP_X_INSTITUTION_ID=institution_id)
    request.user = user

    middleware = TenantContextMiddleware(get_response)
    middleware(request)

    assert captured["user_id"] == str(user.id)
    assert captured["tenant_id"] == institution_id
    # Context is reset once the request finishes.
    assert user_id_var.get() == ""
    assert tenant_id_var.get() == ""


@pytest.mark.unit
def test_tenant_context_middleware_leaves_anonymous_user_blank() -> None:
    captured: dict[str, str] = {}

    def get_response(request: object) -> HttpResponse:
        captured["user_id"] = user_id_var.get()
        return HttpResponse()

    request = RequestFactory().get("/")
    request.user = AnonymousUser()

    TenantContextMiddleware(get_response)(request)

    assert captured["user_id"] == ""
