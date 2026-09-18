import pytest
from django.core.exceptions import PermissionDenied

from domains.connector.services import start_sync_run


@pytest.mark.security
@pytest.mark.django_db
def test_connection_cannot_be_synced_by_another_institution(normalisation_context) -> None:
    _, _, other_institution, connection = normalisation_context

    with pytest.raises(PermissionDenied):
        start_sync_run(connection_id=connection.id, institution=other_institution)
