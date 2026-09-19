"""Rate-limit audit: every unauthenticated or credential-bearing endpoint and every
customer write path is throttled, and every scope a view names has a configured rate."""

import pytest
from django.conf import settings
from django.urls import get_resolver
from rest_framework.throttling import ScopedRateThrottle

from packages.common.throttling import WriteThrottle
from tests.integration.test_customer_api import BASE, as_user
from tests.security.test_customer_auth import make_customer


def _api_view_classes():
    seen = {}

    def walk(patterns):
        for entry in patterns:
            if hasattr(entry, "url_patterns"):
                walk(entry.url_patterns)
                continue
            callback = entry.callback
            cls = getattr(callback, "cls", None) or getattr(callback, "view_class", None)
            if cls is not None:
                seen[cls] = (entry.pattern, callback)

    walk(get_resolver().url_patterns)
    return seen


@pytest.mark.security
def test_every_scope_named_by_a_view_has_a_rate():
    rates = settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]
    missing = []
    for cls, (_pattern, callback) in _api_view_classes().items():
        scopes = {getattr(cls, "throttle_scope", None)}
        for action in getattr(callback, "actions", {}).values():
            scopes.add(getattr(getattr(cls, action, None), "kwargs", {}).get("throttle_scope"))
        missing += [f"{cls.__name__}:{s}" for s in scopes if s and s not in rates]
    assert missing == []


@pytest.mark.security
def test_unauthenticated_credential_endpoints_are_scoped():
    from domains.identity.api import views

    expected = {
        "LoginView": "auth",
        "TokenView": "auth",
        "TokenRefreshView": "auth",
        "TokenRevokeView": "auth",
        "CustomerRegistrationView": "registration",
        "RecoveryRequestView": "recovery",
        "RecoveryConfirmView": "recovery",
    }
    for name, scope in expected.items():
        assert getattr(views, name).throttle_scope == scope, name


@pytest.mark.security
@pytest.mark.django_db
def test_cookie_login_brute_force_is_throttled(api_client, monkeypatch):
    monkeypatch.setitem(ScopedRateThrottle.THROTTLE_RATES, "auth", "3/min")
    body = {"identifier": "nobody@example.test", "password": "wrong-password-123"}

    statuses = [
        api_client.post("/api/v1/auth/login/", body, format="json").status_code for _ in range(4)
    ]

    assert statuses[-1] == 429
    assert 429 not in statuses[:3]


@pytest.mark.security
@pytest.mark.django_db
def test_login_rotates_the_session_key(api_client):
    make_customer("sess@example.test")
    api_client.get("/api/v1/auth/csrf/")  # anonymous session/cookie exists first
    before = api_client.cookies.get("sessionid")
    api_client.post(
        "/api/v1/auth/login/",
        {"identifier": "sess@example.test", "password": "a-long-unusual-passphrase-42"},
        format="json",
    )
    after = api_client.cookies.get("sessionid")

    assert after is not None
    assert before is None or before.value != after.value


@pytest.mark.security
def test_global_backstops_are_configured():
    classes = settings.REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"]
    assert "rest_framework.throttling.UserRateThrottle" in classes
    assert "rest_framework.throttling.AnonRateThrottle" in classes
    assert ScopedRateThrottle.__name__ in "".join(classes)


@pytest.mark.security
@pytest.mark.django_db
def test_customer_writes_are_limited_per_user_but_reads_are_not(api_client, monkeypatch):
    monkeypatch.setitem(WriteThrottle.THROTTLE_RATES, "customer_write", "2/min")
    customer = make_customer("writer@example.test")
    as_user(api_client, customer)

    writes = [api_client.post(f"{BASE}/passport/generate/", {}, format="json") for _ in range(3)]
    reads = [api_client.get(f"{BASE}/home/") for _ in range(5)]

    assert writes[-1].status_code == 429
    assert 429 not in [w.status_code for w in writes[:2]]
    assert all(r.status_code != 429 for r in reads)


@pytest.mark.security
@pytest.mark.django_db
def test_write_budget_is_per_user(api_client, monkeypatch):
    monkeypatch.setitem(WriteThrottle.THROTTLE_RATES, "customer_write", "1/min")
    first, second = make_customer("a@example.test"), make_customer("b@example.test")

    as_user(api_client, first)
    api_client.post(f"{BASE}/passport/generate/", {}, format="json")
    limited = api_client.post(f"{BASE}/passport/generate/", {}, format="json")
    as_user(api_client, second)
    other = api_client.post(f"{BASE}/passport/generate/", {}, format="json")

    assert limited.status_code == 429
    assert other.status_code != 429
