import pytest
from django.core.exceptions import PermissionDenied

from domains.connector.models import RawEvent
from domains.normalisation.services import normalise_raw_event


@pytest.mark.security
@pytest.mark.django_db
def test_raw_event_from_another_tenant_cannot_be_normalised(normalisation_context):
    customer, institution, other_institution, connection = normalisation_context
    assert customer.id == connection.customer_id
    assert institution.id != other_institution.id

    from tests.integration.test_normalisation import create_raw_event, valid_payload

    raw_event = create_raw_event(normalisation_context, valid_payload())
    assert RawEvent.objects.filter(id=raw_event.id, connection__institution=institution).exists()

    with pytest.raises(PermissionDenied):
        normalise_raw_event(raw_event_id=raw_event.id, institution=other_institution)
