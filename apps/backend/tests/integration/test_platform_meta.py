import pytest


@pytest.mark.integration
@pytest.mark.django_db
def test_version_endpoint_is_public_and_exposes_only_safe_fields(api_client, settings):
    settings.APP_ENVIRONMENT = "staging"
    settings.APP_RELEASE = "abc123"

    response = api_client.get("/api/v1/meta/version/")

    assert response.status_code == 200
    assert response.data["data"] == {
        "api_version": "v1",
        "application_version": settings.APP_VERSION,
        "environment": "staging",
        "release": "abc123",
    }


@pytest.mark.integration
@pytest.mark.django_db
def test_capabilities_are_honest_about_admin_surfaces(api_client, normalisation_context):
    api_client.force_authenticate(user=normalisation_context[0])
    data = api_client.get("/api/v1/capabilities/").data["data"]

    for available in ("admin_overview", "customer_directory", "trust_network", "data_export"):
        assert data[available] == "AVAILABLE"
    assert data["bulk_operations"] == "PARTIAL"
    for unavailable in (
        "currency_conversion",
        "fraud_prevented_value",
        "institution_comparison",
        "geographic_risk",
        "team_invitations",
        "api_usage_metrics",
        "quiet_hours",
    ):
        assert data[unavailable] == "NOT_AVAILABLE"


@pytest.mark.integration
@pytest.mark.django_db
def test_developer_docs_and_schema_are_served(api_client):
    schema = api_client.get("/api/schema/")
    assert schema.status_code == 200
    body = schema.content.decode()
    for path in (
        "/api/v1/overview/",
        "/api/v1/exports/",
        "/api/v1/saved-views/",
        "/api/v1/cases/bulk-assign/",
        "/api/v1/team/members/",
    ):
        assert path in body
    assert api_client.get("/api/docs/").status_code == 200
    assert api_client.get("/api/redoc/").status_code == 200


@pytest.mark.integration
@pytest.mark.django_db
def test_access_catalog_sync_is_idempotent_and_authoritative():
    from domains.identity.catalog import DEFAULT_ROLES, PERMISSIONS, sync_access_catalog
    from domains.identity.models import Permission, Role

    first = sync_access_catalog()
    second = sync_access_catalog()

    assert first == second == {"permissions": len(PERMISSIONS), "roles": len(DEFAULT_ROLES)}
    assert Permission.objects.count() == len(PERMISSIONS)
    # Service-level permissions are never granted to a human role.
    for role in Role.objects.all():
        assert "security:observe" not in {p.code for p in role.permissions.all()}
    # Catalog roles are managed in code: drifted permissions are removed on sync.
    viewer = Role.objects.get(code="VIEWER")
    viewer.permissions.add(Permission.objects.get(code="case:manage"))
    sync_access_catalog()
    assert "case:manage" not in {p.code for p in viewer.permissions.all()}
