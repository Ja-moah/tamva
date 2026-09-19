from uuid import uuid4

import pytest

from domains.case.models import Case, CaseAssignment
from domains.case.services import assign_case, transition_case_status
from tests.integration.admin_support import headers, operator
from tests.integration.test_case import (
    allow_risk_event,
    block_risk_event,
    hold_risk_event,
    open_case_from_event_helper,
)
from tests.integration.test_notifications_api import make_notification


def get(api_client, user, url, context, **params):
    api_client.force_authenticate(user=user)
    return api_client.get(url, params, **headers(context))


def post(api_client, user, url, context, body=None, **extra):
    api_client.force_authenticate(user=user)
    return api_client.post(url, body or {}, format="json", **headers(context), **extra)


# ---------------------------------------------------------- risk events


@pytest.fixture
def risk_context(normalisation_context):
    block = block_risk_event(normalisation_context, suffix="b")
    allow = allow_risk_event(normalisation_context, suffix="a")
    return normalisation_context, block, allow, operator(normalisation_context, "risk:read")


@pytest.mark.integration
@pytest.mark.django_db
def test_risk_events_filter_by_decision_reason_severity_and_score(api_client, risk_context):
    context, block, allow, user = risk_context
    url = "/api/v1/risk/events/"

    everything = get(api_client, user, url, context)
    by_decision = get(api_client, user, url, context, decision="BLOCK")
    by_reason = get(api_client, user, url, context, reason_code="CRITICAL_SIGNAL")
    by_severity = get(api_client, user, url, context, severity="CRITICAL")
    high = get(api_client, user, url, context, score_min=str(block.score))
    nothing = get(api_client, user, url, context, score_min="999999")

    assert everything.data["count"] == 2
    assert [r["id"] for r in by_decision.data["results"]] == [str(block.id)]
    assert [r["id"] for r in by_reason.data["results"]] == [str(block.id)]
    assert [r["id"] for r in by_severity.data["results"]] == [str(block.id)]
    assert str(block.id) in [r["id"] for r in high.data["results"]]
    assert nothing.data["count"] == 0
    assert allow.decision == "ALLOW"


@pytest.mark.integration
@pytest.mark.django_db
def test_risk_events_sort_paginate_and_reject_bad_input(api_client, risk_context):
    context, block, _allow, user = risk_context
    url = "/api/v1/risk/events/"

    descending = get(api_client, user, url, context, ordering="-score")
    ascending = get(api_client, user, url, context, ordering="score")
    first_page = get(api_client, user, url, context, page_size="1")
    stale = get(api_client, user, url, context, date_to="2000-01-01")
    alias = get(api_client, user, url, context, customer_id=str(block.customer_id))

    scores = [float(r["score"]) for r in descending.data["results"]]
    assert scores == sorted(scores, reverse=True)
    assert [r["id"] for r in ascending.data["results"]] == [
        r["id"] for r in reversed(descending.data["results"])
    ]
    assert first_page.data["count"] == 2
    assert len(first_page.data["results"]) == 1
    assert first_page.data["next"] is not None
    assert stale.data["count"] == 0
    assert alias.data["count"] == 2
    for bad in ({"decision": "MAYBE"}, {"nope": "1"}, {"ordering": "customer_id"}):
        assert get(api_client, user, url, context, **bad).status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
def test_multi_reason_filter_does_not_duplicate_rows(api_client, normalisation_context):
    block_risk_event(normalisation_context, suffix="dup")
    user = operator(normalisation_context, "risk:read")
    response = get(
        api_client, user, "/api/v1/risk/events/", normalisation_context, severity="CRITICAL"
    )
    assert response.data["count"] == len({r["id"] for r in response.data["results"]})


# ---------------------------------------------------------------- cases


@pytest.fixture
def two_cases(normalisation_context):
    first = open_case_from_event_helper(
        block_risk_event(normalisation_context, suffix="c1"), normalisation_context[1]
    )
    second = open_case_from_event_helper(
        hold_risk_event(normalisation_context, suffix="c2"), normalisation_context[1]
    )
    return normalisation_context, first, second


@pytest.mark.integration
@pytest.mark.django_db
def test_cases_filter_by_status_assignee_priority_and_search(api_client, two_cases):
    context, first, second = two_cases
    user = operator(context, "case:read")
    assign_case(case=first, assignee=user, assigned_by=user, institution=context[1])
    transition_case_status(case=second, new_status=Case.Status.TRIAGED, institution=context[1])
    url = "/api/v1/cases/"

    unassigned = get(api_client, user, url, context, unassigned="true")
    assigned = get(api_client, user, url, context, unassigned="false")
    mine = get(api_client, user, url, context, assignee=str(user.id))
    triaged = get(api_client, user, url, context, status="TRIAGED")
    by_priority = get(api_client, user, url, context, priority=first.priority)
    searched = get(api_client, user, url, context, search=first.reference)
    old = get(api_client, user, url, context, opened_to="2000-01-01")

    assert [c["id"] for c in unassigned.data["results"]] == [str(second.id)]
    assert [c["id"] for c in assigned.data["results"]] == [str(first.id)]
    assert [c["id"] for c in mine.data["results"]] == [str(first.id)]
    assert [c["id"] for c in triaged.data["results"]] == [str(second.id)]
    assert str(first.id) in [c["id"] for c in by_priority.data["results"]]
    assert [c["id"] for c in searched.data["results"]] == [str(first.id)]
    assert old.data["count"] == 0
    assert (
        get(api_client, user, url, context, status="NEW").status_code == 400
    )  # not a backend state


@pytest.mark.integration
@pytest.mark.django_db
def test_case_priority_sorts_by_severity_not_alphabet(api_client, two_cases):
    context, _first, _second = two_cases
    user = operator(context, "case:read")
    rank = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}

    response = get(api_client, user, "/api/v1/cases/", context, ordering="-priority")

    ranks = [rank[c["priority"]] for c in response.data["results"]]
    assert ranks == sorted(ranks, reverse=True)


# --------------------------------------------------------- notifications


@pytest.mark.integration
@pytest.mark.django_db
def test_notifications_filter_by_category_state_and_unread(api_client, normalisation_context):
    notification = make_notification(normalisation_context)
    customer = normalisation_context[0]
    url = "/api/v1/notifications/"

    assert get(api_client, customer, url, normalisation_context, category="CASE").data["count"] == 1
    assert get(api_client, customer, url, normalisation_context, category="X").data["count"] == 0
    assert get(api_client, customer, url, normalisation_context, unread="true").data["count"] == 1
    assert get(api_client, customer, url, normalisation_context, channel="SMS").data["count"] == 0
    first = get(api_client, customer, url, normalisation_context).data["results"][0]
    assert first["category"] == "CASE"
    assert first["id"] == str(notification.id)
    assert get(api_client, customer, url, normalisation_context, state="LOST").status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
def test_bulk_read_marks_only_own_notifications(api_client, normalisation_context):
    notification = make_notification(normalisation_context)
    customer = normalisation_context[0]
    url = "/api/v1/notifications/bulk-read/"
    ids = [str(notification.id), str(uuid4())]

    first = post(api_client, customer, url, normalisation_context, {"notification_ids": ids})
    second = post(api_client, customer, url, normalisation_context, {"notification_ids": ids})

    assert first.data["data"] == {
        "requested": 2,
        "marked_read": 1,
        "already_read": 0,
        "not_found": 1,
    }
    assert second.data["data"]["already_read"] == 1
    assert (
        get(
            api_client, customer, "/api/v1/notifications/", normalisation_context, unread="true"
        ).data["count"]
        == 0
    )
    stranger = operator(normalisation_context, "overview:read")
    stolen = post(api_client, stranger, url, normalisation_context, {"notification_ids": ids[:1]})
    assert stolen.data["data"]["not_found"] == 1
    assert stolen.data["data"]["marked_read"] == 0


# ----------------------------------------------------------- bulk cases


@pytest.mark.integration
@pytest.mark.django_db
def test_bulk_triage_reports_per_item_outcomes(api_client, two_cases):
    context, first, second = two_cases
    manager = operator(context, "case:read", "case:manage")
    transition_case_status(case=first, new_status=Case.Status.TRIAGED, institution=context[1])
    missing = str(uuid4())

    response = post(
        api_client,
        manager,
        "/api/v1/cases/bulk-triage/",
        context,
        {"case_ids": [str(first.id), str(second.id), missing]},
    )

    assert response.status_code == 200
    data = response.data["data"]
    outcomes = {r["id"]: r["outcome"] for r in data["results"]}
    assert outcomes == {str(first.id): "FAILED", str(second.id): "SUCCESS", missing: "NOT_FOUND"}
    assert data["summary"] == {"requested": 3, "succeeded": 1, "failed": 2}
    second.refresh_from_db()
    assert second.status == Case.Status.TRIAGED


@pytest.mark.integration
@pytest.mark.django_db
def test_bulk_assign_is_tenant_safe_and_permissioned(api_client, two_cases):
    context, first, _second = two_cases
    reader = operator(context, "case:read")
    manager = operator(context, "case:read", "case:manage")
    outsider = operator(context, "overview:read", institution=context[2])
    url = "/api/v1/cases/bulk-assign/"
    body = {"case_ids": [str(first.id)], "assignee_id": str(manager.id)}

    assert post(api_client, reader, url, context, body).status_code == 403
    rejected = post(api_client, manager, url, context, {**body, "assignee_id": str(outsider.id)})
    assert rejected.data["data"]["results"][0]["outcome"] == "FAILED"
    ok = post(api_client, manager, url, context, body)
    assert ok.data["data"]["summary"]["succeeded"] == 1
    first.refresh_from_db()
    assert first.current_assignee_id == manager.id
    too_many = post(
        api_client, manager, url, context, {"case_ids": [str(uuid4()) for _ in range(101)]}
    )
    assert too_many.status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
def test_bulk_assign_is_idempotent_per_key(api_client, two_cases):
    context, first, _second = two_cases
    manager = operator(context, "case:read", "case:manage")
    url = "/api/v1/cases/bulk-assign/"
    body = {"case_ids": [str(first.id)], "assignee_id": str(manager.id)}
    key = {"HTTP_IDEMPOTENCY_KEY": "retry-1"}

    once = post(api_client, manager, url, context, body, **key)
    again = post(api_client, manager, url, context, body, **key)
    changed = post(api_client, manager, url, context, {**body, "assignee_id": None}, **key)

    assert once.status_code == again.status_code == 200
    assert again["Idempotent-Replay"] == "true"
    assert again.data == once.data
    assert CaseAssignment.objects.filter(case=first).count() == 1
    assert changed.status_code == 409
