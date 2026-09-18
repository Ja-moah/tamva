import pytest
from django.core.exceptions import PermissionDenied

from domains.ledger.services import post_transaction
from tests.integration.test_ledger import canonical_transaction


@pytest.mark.security
@pytest.mark.django_db
def test_ledger_posting_cannot_cross_tenant(normalisation_context):
    canonical = canonical_transaction(normalisation_context)

    with pytest.raises(PermissionDenied):
        post_transaction(transaction_id=canonical.id, institution=normalisation_context[2])
