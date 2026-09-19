from pathlib import Path

import pytest

ALLOWED = "https://app.example.test"


@pytest.fixture(autouse=True)
def cors(settings):
    settings.CORS_ALLOWED_ORIGINS = [ALLOWED]
    settings.CORS_ALLOW_ALL_ORIGINS = False


@pytest.mark.security
@pytest.mark.django_db
def test_only_configured_origins_receive_cors_headers(api_client):
    allowed = api_client.get("/api/v1/meta/version/", HTTP_ORIGIN=ALLOWED)
    denied = api_client.get("/api/v1/meta/version/", HTTP_ORIGIN="https://evil.example.test")

    assert allowed["Access-Control-Allow-Origin"] == ALLOWED
    assert "Access-Control-Allow-Origin" not in denied
    assert "Access-Control-Allow-Credentials" not in allowed  # bearer auth needs no cookies
    assert "X-Request-ID" in allowed["Access-Control-Expose-Headers"]


@pytest.mark.security
@pytest.mark.django_db
def test_preflight_allows_the_headers_clients_send(api_client):
    response = api_client.options(
        "/api/v1/customer/home/",
        HTTP_ORIGIN=ALLOWED,
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization,x-request-id,x-api-version",
    )

    assert response.status_code == 200
    allowed = response["Access-Control-Allow-Headers"].lower()
    assert all(h in allowed for h in ("authorization", "x-request-id", "x-api-version"))


@pytest.mark.security
@pytest.mark.django_db
def test_null_and_lookalike_origins_are_refused(api_client):
    for origin in ("null", "https://app.example.test.evil.test", "http://app.example.test"):
        response = api_client.get("/api/v1/meta/version/", HTTP_ORIGIN=origin)
        assert "Access-Control-Allow-Origin" not in response, origin


@pytest.mark.security
@pytest.mark.django_db
def test_version_comes_from_the_version_file_and_build_metadata(api_client, settings):
    version_file = Path(__file__).resolve().parents[4] / "VERSION"
    assert settings.APP_VERSION == version_file.read_text().strip()

    settings.APP_RELEASE = "abc1234"
    settings.APP_ENVIRONMENT = "staging"
    data = api_client.get("/api/v1/meta/version/").json()["data"]

    assert data["release"] == "abc1234"
    assert data["environment"] == "staging"
    assert data["application_version"] == settings.APP_VERSION
