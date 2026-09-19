from datetime import timedelta

import pytest
from django.core import mail
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.identity.models import AuthSession, AuthToken, RecoveryToken, User
from domains.identity.tokens import hash_token

PASSWORD = "a-long-unusual-passphrase-42"


def make_customer(email="cust@example.test", password=PASSWORD, **extra):
    return User.objects.create_user(
        username=email,
        email=email,
        password=password,
        identity_type=User.IdentityType.CUSTOMER,
        **extra,
    )


def sign_in(client, email="cust@example.test", password=PASSWORD):
    return client.post(
        "/api/v1/auth/token/",
        {"identifier": email, "password": password, "device_label": "Pixel"},
        format="json",
    )


def bearer(client, token):
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")


# ------------------------------------------------------------ registration


@pytest.mark.security
@pytest.mark.django_db
def test_registration_creates_a_customer_without_membership_or_roles(api_client):
    response = api_client.post(
        "/api/v1/customer/register/",
        {"email": "New@Example.test", "password": PASSWORD, "accepted_terms": True},
        format="json",
    )

    assert response.status_code == 201
    user = User.objects.get(email="new@example.test")
    assert user.identity_type == User.IdentityType.CUSTOMER
    assert user.status == "ACTIVE"
    assert not user.institution_memberships.exists()
    assert user.check_password(PASSWORD)
    assert "password" not in str(response.data).lower()
    event = AuditEvent.objects.get(action="CUSTOMER_REGISTERED")
    assert PASSWORD not in str(event.metadata)


@pytest.mark.security
@pytest.mark.django_db
@pytest.mark.parametrize(
    "body",
    [
        {"email": "x@example.test", "password": PASSWORD, "accepted_terms": False},
        {"email": "x@example.test", "password": "short", "accepted_terms": True},
        {"email": "x@example.test", "password": "12345678901", "accepted_terms": True},
        {"email": "x@example.test", "password": "password12345", "accepted_terms": True},
        {"email": "not-an-email", "password": PASSWORD, "accepted_terms": True},
        {"email": "x@example.test", "password": PASSWORD},
    ],
)
def test_invalid_registrations_are_rejected(api_client, body):
    response = api_client.post("/api/v1/customer/register/", body, format="json")
    assert response.status_code == 400
    assert not User.objects.filter(email="x@example.test").exists()


@pytest.mark.security
@pytest.mark.django_db
def test_duplicate_registration_is_case_insensitive_and_generic(api_client):
    make_customer("dup@example.test")
    response = api_client.post(
        "/api/v1/customer/register/",
        {"email": "DUP@example.test", "password": PASSWORD, "accepted_terms": True},
        format="json",
    )
    assert response.status_code == 400
    assert User.objects.filter(email__iexact="dup@example.test").count() == 1


# --------------------------------------------------------- token lifecycle


@pytest.mark.security
@pytest.mark.django_db
def test_token_sign_in_returns_a_bearer_pair_that_authenticates_as_the_same_user(api_client):
    customer = make_customer()

    response = sign_in(api_client)

    assert response.status_code == 200
    assert response["Cache-Control"] == "no-store"
    data = response.data["data"]
    assert data["token_type"] == "Bearer"
    assert data["actor"]["user"]["id"] == str(customer.id)
    bearer(api_client, data["access_token"])
    me = api_client.get("/api/v1/me/")
    assert me.status_code == 200
    assert me.data["data"]["user"]["email"] == "cust@example.test"
    # Only hashes are stored.
    assert not AuthToken.objects.filter(token_hash=data["access_token"]).exists()
    assert AuthToken.objects.filter(token_hash=hash_token(data["refresh_token"])).exists()


@pytest.mark.security
@pytest.mark.django_db
def test_bad_credentials_and_disabled_users_get_the_same_generic_refusal(api_client):
    make_customer()
    make_customer("off@example.test", status="SUSPENDED")

    wrong = sign_in(api_client, password="wrong-password-value")
    disabled = sign_in(api_client, email="off@example.test")

    assert wrong.status_code == disabled.status_code == 400
    assert not AuthSession.objects.exists()
    assert AuditEvent.objects.filter(action="LOGIN", outcome="FAILURE").count() == 2


@pytest.mark.security
@pytest.mark.django_db
def test_refresh_rotates_the_pair_and_the_old_refresh_token_stops_working(api_client):
    make_customer()
    first = sign_in(api_client).data["data"]

    second = api_client.post(
        "/api/v1/auth/token/refresh/", {"refresh_token": first["refresh_token"]}, format="json"
    )

    assert second.status_code == 200
    new = second.data["data"]
    assert new["refresh_token"] != first["refresh_token"]
    assert new["access_token"] != first["access_token"]
    bearer(api_client, new["access_token"])
    assert api_client.get("/api/v1/me/").status_code == 200


@pytest.mark.security
@pytest.mark.django_db
def test_reusing_a_spent_refresh_token_revokes_the_whole_session(api_client):
    make_customer()
    first = sign_in(api_client).data["data"]
    newer = api_client.post(
        "/api/v1/auth/token/refresh/", {"refresh_token": first["refresh_token"]}, format="json"
    ).data["data"]

    replay = api_client.post(
        "/api/v1/auth/token/refresh/", {"refresh_token": first["refresh_token"]}, format="json"
    )

    assert replay.status_code == 401
    assert AuthSession.objects.get().revoked_reason == "REFRESH_REUSE"
    assert AuditEvent.objects.filter(action="TOKEN_REUSE_DETECTED").exists()
    # The legitimate holder's newest tokens die with the family.
    api_client.credentials()
    assert (
        api_client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh_token": newer["refresh_token"]},
            format="json",
        ).status_code
        == 401
    )
    bearer(api_client, newer["access_token"])
    assert api_client.get("/api/v1/me/").status_code == 401


@pytest.mark.security
@pytest.mark.django_db
def test_expired_access_and_refresh_tokens_are_refused(api_client):
    make_customer()
    tokens = sign_in(api_client).data["data"]
    AuthToken.objects.update(expires_at=timezone.now() - timedelta(seconds=1))

    bearer(api_client, tokens["access_token"])
    assert api_client.get("/api/v1/me/").status_code == 401
    api_client.credentials()
    refreshed = api_client.post(
        "/api/v1/auth/token/refresh/", {"refresh_token": tokens["refresh_token"]}, format="json"
    )
    assert refreshed.status_code == 401


@pytest.mark.security
@pytest.mark.django_db
def test_a_user_disabled_after_sign_in_is_locked_out_immediately(api_client):
    customer = make_customer()
    tokens = sign_in(api_client).data["data"]
    User.objects.filter(pk=customer.pk).update(status="SUSPENDED")

    bearer(api_client, tokens["access_token"])
    assert api_client.get("/api/v1/me/").status_code == 401
    api_client.credentials()
    assert (
        api_client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh_token": tokens["refresh_token"]},
            format="json",
        ).status_code
        == 401
    )


@pytest.mark.security
@pytest.mark.django_db
def test_logout_revokes_the_family_and_is_indistinguishable_when_unmatched(api_client):
    make_customer()
    tokens = sign_in(api_client).data["data"]

    bearer(api_client, tokens["access_token"])
    logout = api_client.post("/api/v1/auth/token/revoke/", {}, format="json")
    api_client.credentials()
    unknown = api_client.post(
        "/api/v1/auth/token/revoke/", {"refresh_token": "nonsense"}, format="json"
    )

    assert logout.status_code == unknown.status_code == 204
    assert AuthSession.objects.get().revoked_reason == "LOGOUT"
    bearer(api_client, tokens["access_token"])
    assert api_client.get("/api/v1/me/").status_code == 401


@pytest.mark.security
@pytest.mark.django_db
def test_malformed_and_unknown_bearer_headers_are_refused_without_detail(api_client):
    for header in ("Bearer", "Bearer a b", "Bearer not-a-real-token"):
        api_client.credentials(HTTP_AUTHORIZATION=header)
        response = api_client.get("/api/v1/me/")
        assert response.status_code == 401
        assert "not-a-real-token" not in str(response.data)


@pytest.mark.security
@pytest.mark.django_db
def test_bearer_requests_need_no_csrf_but_session_requests_still_do(api_client):
    from rest_framework.test import APIClient

    make_customer()
    tokens = sign_in(api_client).data["data"]
    strict = APIClient(enforce_csrf_checks=True)
    strict.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access_token']}")
    assert strict.post("/api/v1/auth/token/revoke-all/").status_code == 204


# ---------------------------------------------------------------- recovery


@pytest.mark.security
@pytest.mark.django_db
def test_recovery_request_is_identical_for_known_and_unknown_addresses(api_client):
    make_customer("known@example.test")

    known = api_client.post(
        "/api/v1/auth/recovery/request/", {"email": "known@example.test"}, format="json"
    )
    unknown = api_client.post(
        "/api/v1/auth/recovery/request/", {"email": "nobody@example.test"}, format="json"
    )

    assert known.status_code == unknown.status_code == 202
    assert known.data == unknown.data
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["known@example.test"]


def _token_from_mail() -> str:
    return mail.outbox[-1].body.split("token=")[1].split()[0]


@pytest.mark.security
@pytest.mark.django_db
def test_recovery_resets_the_password_once_and_ends_all_sessions(api_client):
    make_customer("known@example.test")
    tokens = sign_in(api_client, "known@example.test").data["data"]
    api_client.post(
        "/api/v1/auth/recovery/request/", {"email": "known@example.test"}, format="json"
    )
    token = _token_from_mail()
    assert not RecoveryToken.objects.filter(token_hash=token).exists()  # hashed at rest

    new_password = "another-strong-passphrase-77"
    done = api_client.post(
        "/api/v1/auth/recovery/confirm/",
        {"token": token, "new_password": new_password},
        format="json",
    )
    assert done.status_code == 204
    again = api_client.post(
        "/api/v1/auth/recovery/confirm/",
        {"token": token, "new_password": "yet-another-passphrase-11"},
        format="json",
    )

    assert again.status_code == 400  # single use
    assert sign_in(api_client, "known@example.test", new_password).status_code == 200
    assert sign_in(api_client, "known@example.test").status_code == 400
    assert (
        api_client.post(
            "/api/v1/auth/token/refresh/",
            {"refresh_token": tokens["refresh_token"]},
            format="json",
        ).status_code
        == 401
    )
    assert AuditEvent.objects.filter(action="PASSWORD_RESET").exists()


@pytest.mark.security
@pytest.mark.django_db
def test_recovery_tokens_expire_are_superseded_and_enforce_password_policy(api_client):
    make_customer("known@example.test")
    url = "/api/v1/auth/recovery/request/"
    api_client.post(url, {"email": "known@example.test"}, format="json")
    first = _token_from_mail()
    api_client.post(url, {"email": "known@example.test"}, format="json")
    second = _token_from_mail()
    confirm = "/api/v1/auth/recovery/confirm/"

    superseded = api_client.post(
        confirm, {"token": first, "new_password": "brand-new-passphrase-9"}, format="json"
    )
    weak = api_client.post(confirm, {"token": second, "new_password": "123"}, format="json")
    assert superseded.status_code == 400
    assert weak.status_code == 400

    RecoveryToken.objects.update(expires_at=timezone.now() - timedelta(minutes=1))
    expired = api_client.post(
        confirm, {"token": second, "new_password": "brand-new-passphrase-9"}, format="json"
    )
    assert expired.status_code == 400
    assert (
        api_client.post(
            confirm, {"token": "garbage", "new_password": "brand-new-passphrase-9"}, format="json"
        ).status_code
        == 400
    )
