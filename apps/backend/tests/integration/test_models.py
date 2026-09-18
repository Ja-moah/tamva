import pytest
from django.utils import timezone

from domains.identity.models import User
from domains.partner.models import Institution, InstitutionMembership
from packages.events.models import OutboxEvent


@pytest.mark.integration
@pytest.mark.django_db
def test_foundational_models_persist() -> None:
    user = User.objects.create_user(
        username="partner", email="partner@example.test", identity_type="PARTNER_USER"
    )
    institution = Institution.objects.create(name="Example Bank", slug="example-bank")
    membership = InstitutionMembership.objects.create(
        institution=institution, user=user, role="analyst"
    )
    event = OutboxEvent.objects.create(
        event_type="platform.diagnostic",
        occurred_at=timezone.now(),
        producer="tests",
        tenant_id=institution.id,
        payload={"membership_id": str(membership.id)},
    )
    assert event.tenant_id == institution.id
