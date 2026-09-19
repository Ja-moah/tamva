import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from domains.identity.models import User
from domains.partner.models import Institution


def run(monkeypatch, **overrides):
    monkeypatch.setenv(
        "BOOTSTRAP_ADMIN_PASSWORD", overrides.pop("password", "a-long-unusual-passphrase-42")
    )
    call_command(
        "bootstrap_institution",
        name="First Bank",
        slug="first-bank",
        admin_email=overrides.pop("email", "Admin@Example.test"),
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_creates_an_institution_and_an_administrator_who_can_sign_in(monkeypatch, api_client):
    run(monkeypatch)

    institution = Institution.objects.get(slug="first-bank")
    admin = User.objects.get(email="admin@example.test")
    membership = admin.institution_memberships.get(institution=institution)
    assert membership.roles.filter(code="INSTITUTION_ADMIN").exists()
    login = api_client.post(
        "/api/v1/auth/login/",
        {"identifier": "admin@example.test", "password": "a-long-unusual-passphrase-42"},
        format="json",
    )
    assert login.status_code == 200


@pytest.mark.integration
@pytest.mark.django_db
def test_is_idempotent(monkeypatch):
    run(monkeypatch)
    run(monkeypatch)

    assert Institution.objects.filter(slug="first-bank").count() == 1
    assert User.objects.filter(email="admin@example.test").count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_rejects_a_weak_password_and_customer_emails(monkeypatch):
    with pytest.raises(CommandError, match="Password rejected"):
        run(monkeypatch, password="12345678")
    User.objects.create_user(
        username="c@example.test",
        email="c@example.test",
        password="a-long-unusual-passphrase-42",
        identity_type=User.IdentityType.CUSTOMER,
    )
    with pytest.raises(CommandError, match="non-institutional"):
        run(monkeypatch, email="c@example.test")
