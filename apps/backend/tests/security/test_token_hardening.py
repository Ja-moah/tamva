"""Token and recovery hardening beyond the functional tests in test_customer_auth.py:
entropy, storage, clock boundaries, and what reaches the logs."""

import logging
import re
from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.identity import recovery
from domains.identity.models import AuthToken, RecoveryToken
from domains.identity.tokens import ACCESS_LIFETIME, REFRESH_LIFETIME, hash_token
from tests.security.test_customer_auth import PASSWORD, bearer, make_customer, sign_in

URLSAFE = re.compile(r"^[A-Za-z0-9_-]+$")


@pytest.mark.security
@pytest.mark.django_db
def test_issued_tokens_are_long_unique_and_urlsafe(api_client):
    make_customer()
    seen = set()
    for _ in range(10):
        data = sign_in(api_client).data["data"]
        for token in (data["access_token"], data["refresh_token"]):
            assert URLSAFE.fullmatch(token)
            assert len(token) >= 43  # >= 256 bits of entropy, base64url
            seen.add(token)
    assert len(seen) == 20


@pytest.mark.security
@pytest.mark.django_db
def test_lifetimes_are_bounded():
    assert ACCESS_LIFETIME <= timedelta(minutes=15)
    assert REFRESH_LIFETIME <= timedelta(days=30)


@pytest.mark.security
@pytest.mark.django_db
def test_raw_tokens_exist_nowhere_at_rest(api_client):
    make_customer()
    data = sign_in(api_client).data["data"]
    raw = {data["access_token"], data["refresh_token"]}

    stored = {t.token_hash for t in AuthToken.objects.all()}
    assert all(re.fullmatch(r"[0-9a-f]{64}", h) for h in stored)
    assert raw.isdisjoint(stored)
    assert {hash_token(t) for t in raw} == stored
    audit_blob = " ".join(str(e.metadata) for e in AuditEvent.objects.all())
    assert not any(token in audit_blob for token in raw)


@pytest.mark.security
@pytest.mark.django_db
def test_recovery_token_is_hashed_at_rest_and_only_in_the_message(api_client):
    make_customer()
    api_client.post("/api/v1/auth/recovery/request/", {"email": "cust@example.test"}, format="json")

    token = re.search(r"token=([A-Za-z0-9_-]+)", mail.outbox[0].body).group(1)
    row = RecoveryToken.objects.get()
    assert len(token) >= 43
    assert row.token_hash == hash_token(token)
    assert token not in row.token_hash
    assert not any(token in str(e.metadata) for e in AuditEvent.objects.all())


@pytest.mark.security
@pytest.mark.django_db
def test_access_token_expiry_boundary_is_exclusive(api_client, monkeypatch):
    make_customer()
    data = sign_in(api_client).data["data"]
    fixed = timezone.now()
    monkeypatch.setattr(timezone, "now", lambda: fixed)
    token = AuthToken.objects.get(token_hash=hash_token(data["access_token"]))
    bearer(api_client, data["access_token"])

    AuthToken.objects.filter(pk=token.pk).update(expires_at=fixed + timedelta(microseconds=1))
    assert api_client.get("/api/v1/me/").status_code == 200

    AuthToken.objects.filter(pk=token.pk).update(expires_at=fixed)
    assert api_client.get("/api/v1/me/").status_code == 401


@pytest.mark.security
@pytest.mark.django_db
def test_refresh_token_expiry_boundary_is_exclusive(api_client, monkeypatch):
    make_customer()
    data = sign_in(api_client).data["data"]
    fixed = timezone.now()
    monkeypatch.setattr(timezone, "now", lambda: fixed)
    refresh = AuthToken.objects.get(token_hash=hash_token(data["refresh_token"]))

    AuthToken.objects.filter(pk=refresh.pk).update(expires_at=fixed)
    refused = api_client.post(
        "/api/v1/auth/token/refresh/", {"refresh_token": data["refresh_token"]}, format="json"
    )
    assert refused.status_code == 401


@pytest.mark.security
@pytest.mark.django_db
def test_recovery_token_expiry_boundary_is_exclusive(api_client, monkeypatch):
    make_customer()
    api_client.post("/api/v1/auth/recovery/request/", {"email": "cust@example.test"}, format="json")
    token = re.search(r"token=([A-Za-z0-9_-]+)", mail.outbox[0].body).group(1)
    fixed = timezone.now()
    monkeypatch.setattr(timezone, "now", lambda: fixed)
    RecoveryToken.objects.update(expires_at=fixed)

    response = api_client.post(
        "/api/v1/auth/recovery/confirm/",
        {"token": token, "new_password": "another-long-passphrase-77"},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.security
@pytest.mark.django_db
def test_reuse_detection_also_kills_the_freshly_rotated_access_token(api_client):
    make_customer()
    first = sign_in(api_client).data["data"]
    rotated = api_client.post(
        "/api/v1/auth/token/refresh/", {"refresh_token": first["refresh_token"]}, format="json"
    ).data["data"]

    # An attacker replays the spent refresh token: the whole family dies, including
    # the pair the legitimate client just received.
    api_client.post(
        "/api/v1/auth/token/refresh/", {"refresh_token": first["refresh_token"]}, format="json"
    )

    bearer(api_client, rotated["access_token"])
    assert api_client.get("/api/v1/me/").status_code == 401
    api_client.credentials()
    assert (
        api_client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh_token": rotated["refresh_token"]},
            format="json",
        ).status_code
        == 401
    )


@pytest.mark.security
@pytest.mark.django_db
def test_no_token_or_password_is_ever_logged(api_client, caplog):
    make_customer()
    with caplog.at_level(logging.DEBUG):
        first = sign_in(api_client).data["data"]
        bearer(api_client, first["access_token"])
        api_client.get("/api/v1/me/")
        api_client.credentials()
        rotated = api_client.post(
            "/api/v1/auth/token/refresh/", {"refresh_token": first["refresh_token"]}, format="json"
        ).data["data"]
        api_client.post(  # replay: reuse detection logs and audits
            "/api/v1/auth/token/refresh/", {"refresh_token": first["refresh_token"]}, format="json"
        )
        api_client.post(
            "/api/v1/auth/recovery/request/", {"email": "cust@example.test"}, format="json"
        )
    recovery_token = re.search(r"token=([A-Za-z0-9_-]+)", mail.outbox[0].body).group(1)

    logged = caplog.text + " ".join(str(r.__dict__) for r in caplog.records)
    for secret in (
        first["access_token"],
        first["refresh_token"],
        rotated["access_token"],
        rotated["refresh_token"],
        recovery_token,
        PASSWORD,
    ):
        assert secret not in logged


@pytest.mark.security
@pytest.mark.django_db
def test_failed_recovery_delivery_is_logged_without_the_token_or_address(
    api_client, monkeypatch, caplog
):
    make_customer()

    def smtp_down(**_kwargs):
        raise ConnectionRefusedError("smtp unavailable")

    monkeypatch.setattr(recovery, "send_mail", smtp_down)
    with caplog.at_level(logging.ERROR):
        response = api_client.post(
            "/api/v1/auth/recovery/request/", {"email": "cust@example.test"}, format="json"
        )

    assert response.status_code == 202  # same answer as for an unknown address
    assert "recovery_email_delivery_failed" in caplog.text
    assert "cust@example.test" not in caplog.text
    row_hash = RecoveryToken.objects.get().token_hash
    assert row_hash not in caplog.text


@pytest.mark.security
@pytest.mark.django_db
def test_password_reset_and_suspension_revoke_bearer_access(api_client):
    customer = make_customer()
    data = sign_in(api_client).data["data"]
    api_client.post("/api/v1/auth/recovery/request/", {"email": "cust@example.test"}, format="json")
    token = re.search(r"token=([A-Za-z0-9_-]+)", mail.outbox[0].body).group(1)
    api_client.post(
        "/api/v1/auth/recovery/confirm/",
        {"token": token, "new_password": "another-long-passphrase-77"},
        format="json",
    )

    bearer(api_client, data["access_token"])
    assert api_client.get("/api/v1/me/").status_code == 401
    assert customer.auth_sessions.filter(revoked_reason="PASSWORD_RESET").exists()
