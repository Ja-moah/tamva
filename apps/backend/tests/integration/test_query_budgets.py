"""Query budgets for the hot read paths: Admin overview/analytics/lists and the
customer home/activity. Each endpoint must (a) stay within a fixed ceiling and
(b) not gain queries as the data grows (the N+1 signature)."""

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from packages.common.pagination import DefaultPagination
from tests.integration.admin_support import headers, operator
from tests.integration.test_case import block_risk_event, open_case_from_event_helper
from tests.integration.test_customer_api import BASE, ENDPOINTS, as_user, populated  # noqa: F401
from tests.integration.test_ledger import canonical_transaction

CUSTOMER_CEILING = 30
ADMIN_CEILING = 45


def count_queries(client, url, **extra):
    with CaptureQueriesContext(connection) as captured:
        response = client.get(url, **extra)
    assert response.status_code == 200, response.content
    return len(captured)


@pytest.mark.integration
@pytest.mark.django_db
@pytest.mark.parametrize("path", ENDPOINTS)
def test_every_customer_endpoint_stays_within_the_query_ceiling(api_client, populated, path):  # noqa: F811
    as_user(api_client, populated[0])

    assert count_queries(api_client, f"{BASE}{path}") <= CUSTOMER_CEILING


@pytest.mark.integration
@pytest.mark.django_db
@pytest.mark.parametrize("path", ["/home/", "/activity/"])
def test_customer_reads_do_not_grow_with_activity(api_client, populated, path):  # noqa: F811
    as_user(api_client, populated[0])
    before = count_queries(api_client, f"{BASE}{path}")

    for i in range(6):
        canonical_transaction(
            populated,
            source_event_id=f"perf-{i}",
            direction="DEBIT",
            amount="5.00",
            counterparty_name=f"Vendor {i}",
        )
    after = count_queries(api_client, f"{BASE}{path}")

    assert after == before


@pytest.mark.integration
@pytest.mark.django_db
@pytest.mark.parametrize(
    ("url", "permission"),
    [
        ("/api/v1/overview/", "overview:read"),
        ("/api/v1/analytics/summary/", "analytics:read"),
        ("/api/v1/customers/", "customer:read"),
        ("/api/v1/notifications/", "notification:read"),
        ("/api/v1/audit/events/", "audit:read"),
    ],
)
def test_admin_reads_are_bounded_and_do_not_grow_with_cases(
    api_client, normalisation_context, url, permission
):
    user = operator(normalisation_context, permission)
    api_client.force_authenticate(user=user)
    extra = headers(normalisation_context)
    before = count_queries(api_client, url, **extra)

    for i in range(5):
        open_case_from_event_helper(
            block_risk_event(normalisation_context, suffix=f"budget-{i}"),
            normalisation_context[1],
        )
    after = count_queries(api_client, url, **extra)

    assert before <= ADMIN_CEILING
    assert after <= before + 1  # an unrelated lazy lookup, never one query per row


@pytest.mark.unit
def test_page_size_is_capped():
    assert DefaultPagination.page_size <= 25
    assert DefaultPagination.max_page_size == 100
