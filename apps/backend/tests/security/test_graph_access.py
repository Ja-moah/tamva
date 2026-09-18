import pytest
from django.core.exceptions import PermissionDenied

from domains.graph.services import sync_customer_graph
from domains.ledger.services import post_transaction
from tests.integration.test_ledger import canonical_transaction


@pytest.mark.security
@pytest.mark.django_db
def test_graph_sync_cannot_cross_institution_boundary(normalisation_context) -> None:
    txn = canonical_transaction(normalisation_context, source_event_id="security-graph")
    post_transaction(transaction_id=txn.id, institution=normalisation_context[1])

    with pytest.raises(PermissionDenied):
        sync_customer_graph(institution=normalisation_context[2], customer=normalisation_context[0])
