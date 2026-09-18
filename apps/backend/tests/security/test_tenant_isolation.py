import pytest

from domains.identity.models import User
from domains.partner.models import Institution, InstitutionMembership


@pytest.mark.security
@pytest.mark.django_db
def test_membership_query_is_explicitly_tenant_scoped() -> None:
    user = User.objects.create_user(
        username="member", email="member@example.test", identity_type="PARTNER_USER"
    )
    first = Institution.objects.create(name="First", slug="first")
    second = Institution.objects.create(name="Second", slug="second")
    InstitutionMembership.objects.create(institution=first, user=user, role="analyst")

    assert InstitutionMembership.objects.filter(institution=first, user=user).exists()
    assert not InstitutionMembership.objects.filter(institution=second, user=user).exists()
