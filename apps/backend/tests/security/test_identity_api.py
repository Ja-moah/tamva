import pytest
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework.views import APIView

from domains.audit.models import AuditEvent
from domains.identity.api.permissions import HasPermission
from domains.identity.models import Permission, Role, User
from domains.partner.models import Institution, InstitutionMembership


@pytest.fixture
def partner_context():
    user = User.objects.create_user(
        username="analyst",
        email="analyst@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.PARTNER_USER,
    )
    institution = Institution.objects.create(name="Partner Bank", slug="partner-bank")
    membership = InstitutionMembership.objects.create(
        institution=institution, user=user, status="ACTIVE"
    )
    permission = Permission.objects.create(code="risk:read", name="Read risk decisions")
    role = Role.objects.create(code="RISK_ANALYST", name="Risk analyst")
    role.permissions.add(permission)
    membership.roles.add(role)
    return user, institution


@pytest.mark.django_db
def test_login_and_me_return_tenant_roles_and_permissions(api_client: APIClient, partner_context):
    user, institution = partner_context

    response = api_client.post(
        "/api/v1/auth/login/",
        {"identifier": user.email, "password": "correct horse battery staple"},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["data"]["tenant"]["institution_id"] == str(institution.id)
    assert response.data["data"]["roles"] == ["RISK_ANALYST"]
    assert response.data["data"]["permissions"] == ["risk:read"]
    assert AuditEvent.objects.filter(actor=user, action="LOGIN", outcome="SUCCESS").exists()

    me_response = api_client.get("/api/v1/me/")
    assert me_response.status_code == 200
    assert me_response.data["data"]["user"]["actor_type"] == "PARTNER_USER"


@pytest.mark.django_db
def test_invalid_login_is_rejected_and_audited(api_client: APIClient):
    user = User.objects.create_user(
        username="customer",
        email="customer@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.CUSTOMER,
    )

    response = api_client.post(
        "/api/v1/auth/login/",
        {"identifier": user.email, "password": "wrong"},
        format="json",
    )

    assert response.status_code == 400
    assert AuditEvent.objects.filter(action="LOGIN", outcome="FAILURE").exists()


@pytest.mark.django_db
def test_suspended_user_cannot_login(api_client: APIClient):
    user = User.objects.create_user(
        username="suspended",
        email="suspended@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.PARTNER_USER,
        status="SUSPENDED",
    )

    response = api_client.post(
        "/api/v1/auth/login/",
        {"identifier": user.email, "password": "correct horse battery staple"},
        format="json",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_cross_tenant_context_is_denied(api_client: APIClient, partner_context):
    user, _ = partner_context
    other = Institution.objects.create(name="Other Bank", slug="other-bank")
    api_client.force_authenticate(user=user)

    response = api_client.get("/api/v1/me/", HTTP_X_INSTITUTION_ID=str(other.id))

    assert response.status_code == 403


@pytest.mark.django_db
def test_permission_requires_role_and_tenant(partner_context):
    user, institution = partner_context

    class RiskView(APIView):
        permission_classes = [IsAuthenticated, HasPermission]
        required_permission = "risk:read"

        def get(self, request):
            return Response({"ok": True})

    factory = APIRequestFactory()
    allowed_request = factory.get("/risk/", HTTP_X_INSTITUTION_ID=str(institution.id))
    force_authenticate(allowed_request, user=user)
    denied_institution = Institution.objects.create(name="No Access", slug="no-access")
    denied_request = factory.get("/risk/", HTTP_X_INSTITUTION_ID=str(denied_institution.id))
    force_authenticate(denied_request, user=user)
    allowed = RiskView.as_view()(allowed_request)
    denied = RiskView.as_view()(denied_request)

    assert allowed.status_code == 200
    assert denied.status_code == 403


@pytest.mark.django_db
def test_customer_cannot_use_partner_permission(partner_context):
    _, institution = partner_context
    customer = User.objects.create_user(
        username="customer",
        email="customer@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.CUSTOMER,
    )

    class RiskView(APIView):
        permission_classes = [IsAuthenticated, HasPermission]
        required_permission = "risk:read"

        def get(self, request):
            return Response({"ok": True})

    request = APIRequestFactory().get("/risk/", HTTP_X_INSTITUTION_ID=str(institution.id))
    force_authenticate(request, user=customer)

    assert RiskView.as_view()(request).status_code == 403


@pytest.mark.django_db
def test_refresh_and_logout_end_session(api_client: APIClient, partner_context):
    user, _ = partner_context
    api_client.force_authenticate(user=user)

    refresh_response = api_client.post("/api/v1/auth/refresh/", format="json")
    assert refresh_response.status_code == 200

    logout_response = api_client.post("/api/v1/auth/logout/", format="json")
    assert logout_response.status_code == 204


@pytest.mark.security
@pytest.mark.django_db
def test_csrf_endpoint_gives_native_clients_a_token_that_unsafe_requests_accept() -> None:
    from rest_framework.test import APIClient

    user = User.objects.create_user(
        username="mobile-customer",
        email="mobile-customer@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.CUSTOMER,
    )
    client = APIClient(enforce_csrf_checks=True)

    token_response = client.get("/api/v1/auth/csrf/")
    assert token_response.status_code == 200
    assert token_response["Cache-Control"] == "no-store"
    assert "csrftoken" in token_response.cookies
    token = token_response.data["data"]["csrf_token"]

    login = client.post(
        "/api/v1/auth/login/",
        {"identifier": user.email, "password": "correct horse battery staple"},
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )
    assert login.status_code == 200

    # The token rotates on login; the old one no longer authorises unsafe calls.
    stale = client.post("/api/v1/auth/logout/", HTTP_X_CSRFTOKEN=token)
    assert stale.status_code == 403
    fresh = client.get("/api/v1/auth/csrf/").data["data"]["csrf_token"]
    assert client.post("/api/v1/auth/logout/", HTTP_X_CSRFTOKEN=fresh).status_code == 204


@pytest.mark.contract
@pytest.mark.django_db
def test_every_response_carries_request_and_api_version_headers(api_client) -> None:
    response = api_client.get("/health/", HTTP_X_REQUEST_ID="req-abc")
    assert response["X-Request-ID"] == "req-abc"
    assert response["X-API-Version"] == "1"
