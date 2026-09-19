from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from domains.connector.models import ConnectorDefinition
from domains.connector.services import create_connection
from domains.consent.models import ConsentPurpose, ConsentScope
from domains.consent.services import grant_consent
from domains.identity.models import User
from domains.partner.models import Institution


@pytest.fixture(autouse=True)
def _fresh_throttle_state():
    """Throttle counters live in the cache; never let one test spend another's budget."""
    from django.core.cache import cache

    cache.clear()
    yield


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def normalisation_context():
    customer = User.objects.create_user(
        username="normalisation-customer",
        email="normalisation-customer@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.CUSTOMER,
    )
    institution = Institution.objects.create(name="Normalisation Bank", slug="normalisation-bank")
    other_institution = Institution.objects.create(name="Other Bank", slug="normalisation-other")
    purpose = ConsentPurpose.objects.create(
        institution=institution, code="canonical-mapping", name="Canonical mapping"
    )
    scope = ConsentScope.objects.create(code="transactions:read", name="Read transactions")
    connector = ConnectorDefinition.objects.create(
        provider="normalisation-provider", name="Normalisation Provider", version="2.1"
    )
    connection = create_connection(
        institution=institution,
        customer_id=customer.id,
        connector=connector,
        external_reference="account-456",
        purpose_code=purpose.code,
        scope_code=scope.code,
        credential_reference="vault://connector/account-456",
    )
    grant_consent(
        customer=customer,
        institution=institution,
        purpose=purpose,
        scopes=[scope],
        actor=customer,
        expires_at=timezone.now() + timedelta(days=30),
    )
    return customer, institution, other_institution, connection
