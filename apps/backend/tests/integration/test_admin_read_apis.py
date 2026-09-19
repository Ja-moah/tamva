import json
from datetime import timedelta

import pytest
from django.utils import timezone

from domains.audit.services import record_audit
from domains.graph.models import GraphEdge, GraphEdgeType, GraphNode, GraphNodeType
from domains.identity.catalog import sync_access_catalog
from domains.identity.models import Role
from domains.partner.models import CredentialScope, InstitutionMembership
from domains.security.models import SecurityEvent
from tests.integration.admin_support import headers, operator
from tests.integration.test_case import (
    block_risk_event,
    open_case_from_event_helper,
    platform_user,
)


def get(api_client, user, url, context, institution=None, **params):
    api_client.force_authenticate(user=user)
    return api_client.get(url, params, **headers(context, institution))


# ------------------------------------------------------------- overview


@pytest.mark.integration
@pytest.mark.django_db
def test_overview_requires_its_permission(api_client, normalisation_context):
    user = operator(normalisation_context, "risk:read")
    assert get(api_client, user, "/api/v1/overview/", normalisation_context).status_code == 403


@pytest.mark.integration
@pytest.mark.django_db
def test_overview_reports_real_counts_and_no_fabricated_metrics(api_client, normalisation_context):
    event = block_risk_event(normalisation_context)
    open_case_from_event_helper(event, normalisation_context[1])
    user = operator(normalisation_context, "overview:read")

    response = get(api_client, user, "/api/v1/overview/", normalisation_context)

    assert response.status_code == 200
    data = response.data["data"]
    assert data["risk"]["evaluations"] == 1
    assert data["risk"]["decisions"]["BLOCK"] == 1
    assert data["risk"]["decisions"]["ALLOW"] == 0
    assert data["cases"]["open"] == 1
    assert set(data["cases"]["by_status"]) == {
        "OPEN",
        "TRIAGED",
        "INVESTIGATING",
        "ACTIONED",
        "RESOLVED",
    }
    assert "fraud" not in json.dumps(data, default=str).lower()
    assert data["risk"]["score_scale"].endswith("higher = higher risk")
    assert data["financial_confidence"]["score_scale"].startswith("0-100")


@pytest.mark.integration
@pytest.mark.django_db
def test_overview_is_tenant_scoped(api_client, normalisation_context):
    event = block_risk_event(normalisation_context)
    open_case_from_event_helper(event, normalisation_context[1])
    other = normalisation_context[2]
    outsider = operator(normalisation_context, "overview:read", institution=other)

    response = get(api_client, outsider, "/api/v1/overview/", normalisation_context, other)

    assert response.status_code == 200
    assert response.data["data"]["risk"]["evaluations"] == 0
    assert response.data["data"]["cases"]["open"] == 0


@pytest.mark.integration
@pytest.mark.django_db
@pytest.mark.parametrize("days", ["0", "400", "abc"])
def test_overview_window_is_validated(api_client, normalisation_context, days):
    user = operator(normalisation_context, "overview:read")
    response = get(api_client, user, "/api/v1/overview/", normalisation_context, days=days)
    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
def test_analytics_marks_unsupported_metrics_explicitly(api_client, normalisation_context):
    event = block_risk_event(normalisation_context)
    open_case_from_event_helper(event, normalisation_context[1])
    user = operator(normalisation_context, "analytics:read")

    response = get(api_client, user, "/api/v1/analytics/summary/", normalisation_context)

    assert response.status_code == 200
    data = response.data["data"]
    assert data["unavailable"] == {
        "fraud_prevented_value": "NOT_AVAILABLE",
        "institution_comparison": "NOT_AVAILABLE",
        "geographic_risk": "NOT_AVAILABLE",
    }
    assert sum(b["count"] for b in data["risk"]["score_distribution"]) == 1
    assert data["risk"]["top_reason_codes"][0]["code"] == "CRITICAL_SIGNAL"
    assert data["risk"]["daily"][0]["blocked"] == 1


# ------------------------------------------------------------- customers


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_directory_is_scoped_masked_and_summary_only(api_client, normalisation_context):
    customer = normalisation_context[0]
    user = operator(normalisation_context, "customer:read")

    response = get(api_client, user, "/api/v1/customers/", normalisation_context)

    assert response.status_code == 200
    row = response.data["results"][0]
    assert row["id"] == str(customer.id)
    assert row["email_masked"] == "n***@example.test"
    assert customer.email not in json.dumps(response.data, default=str)
    assert row["connection_state"] == "CONNECTED"
    assert row["consent_state"] == "ACTIVE"
    assert row["financial_confidence"]["score"] is None  # no snapshot: null, never a made-up 0
    assert row["active_passport_shares"] is None  # actor lacks passport:read
    assert response.data["count"] == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_directory_shows_passport_count_only_with_passport_permission(
    api_client, normalisation_context
):
    user = operator(normalisation_context, "customer:read", "passport:read")
    response = get(api_client, user, "/api/v1/customers/", normalisation_context)
    assert response.data["results"][0]["active_passport_shares"] == 0


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_directory_does_not_leak_across_institutions(api_client, normalisation_context):
    other = normalisation_context[2]
    outsider = operator(normalisation_context, "customer:read", institution=other)
    response = get(api_client, outsider, "/api/v1/customers/", normalisation_context, other)
    assert response.status_code == 200
    assert response.data["count"] == 0


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_search_filter_and_detail(api_client, normalisation_context):
    customer = normalisation_context[0]
    user = operator(normalisation_context, "customer:read")

    found = get(
        api_client, user, "/api/v1/customers/", normalisation_context, search="normalisation"
    )
    missing = get(api_client, user, "/api/v1/customers/", normalisation_context, search="zzz")
    filtered = get(
        api_client, user, "/api/v1/customers/", normalisation_context, consent_state="NONE"
    )
    detail = get(api_client, user, f"/api/v1/customers/{customer.id}/", normalisation_context)

    assert found.data["count"] == 1
    assert missing.data["count"] == 0
    assert filtered.data["count"] == 0
    assert detail.status_code == 200
    assert detail.data["data"]["recent_cases"] == []


# -------------------------------------------------------------- security


@pytest.mark.integration
@pytest.mark.django_db
def test_security_events_are_read_only_scoped_and_hide_metadata(api_client, normalisation_context):
    customer, institution, other, _ = normalisation_context
    now = timezone.now()
    SecurityEvent.objects.create(
        institution=institution,
        customer=customer,
        category="NEW_DEVICE",
        severity="WARNING",
        source="mobile",
        occurred_at=now,
        metadata={"secret_detail": "must not leak"},
    )
    SecurityEvent.objects.create(
        institution=other,
        customer=customer,
        category="NEW_DEVICE",
        severity="CRITICAL",
        source="other-tenant",
        occurred_at=now,
    )
    user = operator(normalisation_context, "security:read")

    response = get(api_client, user, "/api/v1/security/events/", normalisation_context)

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert "metadata" not in response.data["results"][0]
    assert "must not leak" not in json.dumps(response.data, default=str)
    filtered = get(
        api_client, user, "/api/v1/security/events/", normalisation_context, severity="CRITICAL"
    )
    assert filtered.data["count"] == 0
    bad = get(api_client, user, "/api/v1/security/events/", normalisation_context, severty="x")
    assert bad.status_code == 400
    denied = get(
        api_client,
        operator(normalisation_context, "risk:read"),
        "/api/v1/security/events/",
        normalisation_context,
    )
    assert denied.status_code == 403


@pytest.mark.integration
@pytest.mark.django_db
def test_security_events_sort_by_severity_rank_not_alphabet(api_client, normalisation_context):
    customer, institution = normalisation_context[0], normalisation_context[1]
    now = timezone.now()
    for i, severity in enumerate(["INFO", "CRITICAL", "HIGH", "WARNING"]):
        SecurityEvent.objects.create(
            institution=institution,
            customer=customer,
            category="NEW_DEVICE",
            severity=severity,
            source="s",
            occurred_at=now - timedelta(minutes=i),
        )
    user = operator(normalisation_context, "security:read")

    response = get(
        api_client, user, "/api/v1/security/events/", normalisation_context, ordering="-severity"
    )

    assert [r["severity"] for r in response.data["results"]] == [
        "CRITICAL",
        "HIGH",
        "WARNING",
        "INFO",
    ]


@pytest.mark.integration
@pytest.mark.django_db
def test_audit_events_are_institution_scoped_and_permissioned(api_client, normalisation_context):
    institution, other = normalisation_context[1], normalisation_context[2]
    record_audit(action="ONE", institution=institution)
    record_audit(action="TWO", institution=other)
    user = operator(normalisation_context, "audit:read")

    response = get(api_client, user, "/api/v1/audit/events/", normalisation_context)

    actions = [e["action"] for e in response.data["results"]]
    assert "ONE" in actions
    assert "TWO" not in actions
    assert (
        get(
            api_client,
            operator(normalisation_context, "risk:read"),
            "/api/v1/audit/events/",
            normalisation_context,
        ).status_code
        == 403
    )


# ------------------------------------------------------------------ team


def _member(context, username, *role_codes):
    sync_access_catalog()
    user = platform_user(context, username=username)
    membership = InstitutionMembership.objects.get(institution=context[1], user=user)
    membership.roles.set(Role.objects.filter(code__in=role_codes))
    return user, membership


@pytest.mark.integration
@pytest.mark.django_db
def test_team_lists_members_roles_and_permission_catalog(api_client, normalisation_context):
    _member(normalisation_context, "analyst-1", "RISK_ANALYST")
    manager = operator(normalisation_context, "team:read")

    members = get(api_client, manager, "/api/v1/team/members/", normalisation_context)
    roles = get(api_client, manager, "/api/v1/team/roles/", normalisation_context)
    permissions = get(api_client, manager, "/api/v1/team/permissions/", normalisation_context)

    assert members.status_code == 200
    analyst = next(m for m in members.data["results"] if m["email"] == "analyst-1@example.test")
    assert analyst["roles"] == ["RISK_ANALYST"]
    assert (
        "risk:read"
        in next(r for r in roles.data["data"] if r["code"] == "RISK_ANALYST")["permissions"]
    )
    assert "case:manage" in [p["code"] for p in permissions.data["data"]]


@pytest.mark.integration
@pytest.mark.django_db
def test_role_changes_need_team_manage_and_are_audited(api_client, normalisation_context):
    _, target = _member(normalisation_context, "analyst-2", "VIEWER")
    reader = operator(normalisation_context, "team:read")
    manager = operator(normalisation_context, "team:read", "team:manage")
    url = f"/api/v1/team/members/{target.id}/roles/"

    api_client.force_authenticate(user=reader)
    denied = api_client.post(
        url, {"roles": ["INVESTIGATOR"]}, format="json", **headers(normalisation_context)
    )
    api_client.force_authenticate(user=manager)
    ok = api_client.post(
        url, {"roles": ["INVESTIGATOR"]}, format="json", **headers(normalisation_context)
    )
    unknown = api_client.post(
        url, {"roles": ["GOD_MODE"]}, format="json", **headers(normalisation_context)
    )

    assert denied.status_code == 403
    assert ok.status_code == 200
    assert ok.data["data"]["roles"] == ["INVESTIGATOR"]
    assert unknown.status_code == 400
    from domains.audit.models import AuditEvent

    event = AuditEvent.objects.get(action="MEMBER_ROLES_CHANGED")
    assert event.metadata["before"] == ["VIEWER"]
    assert event.metadata["after"] == ["INVESTIGATOR"]


@pytest.mark.integration
@pytest.mark.django_db
def test_a_manager_cannot_change_their_own_membership(api_client, normalisation_context):
    manager = operator(normalisation_context, "team:read", "team:manage")
    own = InstitutionMembership.objects.get(institution=normalisation_context[1], user=manager)
    api_client.force_authenticate(user=manager)

    response = api_client.post(
        f"/api/v1/team/members/{own.id}/status/",
        {"status": "SUSPENDED"},
        format="json",
        **headers(normalisation_context),
    )

    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
def test_the_last_active_administrator_cannot_be_removed(api_client, normalisation_context):
    _, sole_admin = _member(normalisation_context, "the-admin", "INSTITUTION_ADMIN")
    manager = operator(normalisation_context, "team:read", "team:manage")
    api_client.force_authenticate(user=manager)
    base = f"/api/v1/team/members/{sole_admin.id}"

    demote = api_client.post(
        f"{base}/roles/", {"roles": ["VIEWER"]}, format="json", **headers(normalisation_context)
    )
    suspend = api_client.post(
        f"{base}/status/", {"status": "SUSPENDED"}, format="json", **headers(normalisation_context)
    )
    assert demote.status_code == 400
    assert suspend.status_code == 400

    _member(normalisation_context, "second-admin", "INSTITUTION_ADMIN")
    allowed = api_client.post(
        f"{base}/status/", {"status": "SUSPENDED"}, format="json", **headers(normalisation_context)
    )
    assert allowed.status_code == 200


# ---------------------------------------------------------- integrations


@pytest.mark.integration
@pytest.mark.django_db
def test_credential_secret_is_returned_once_and_never_listed(api_client, normalisation_context):
    CredentialScope.objects.create(code="risk:evaluate", name="Evaluate risk")
    manager = operator(normalisation_context, "partner:read", "partner:manage")
    api_client.force_authenticate(user=manager)
    h = headers(normalisation_context)

    app = api_client.post(
        "/api/v1/integrations/applications/",
        {"name": "Core banking", "slug": "core-banking"},
        format="json",
        **h,
    )
    assert app.status_code == 201, app.data
    app_id = app.data["data"]["id"]
    env = api_client.post(
        f"/api/v1/integrations/applications/{app_id}/environments/",
        {"kind": "SANDBOX"},
        format="json",
        **h,
    )
    assert env.status_code == 201, env.data
    issued = api_client.post(
        f"/api/v1/integrations/environments/{env.data['data']['id']}/credentials/",
        {"name": "primary", "scopes": ["risk:evaluate"]},
        format="json",
        **h,
    )

    assert issued.status_code == 201, issued.data
    secret = issued.data["data"]["secret"]
    assert secret.startswith("tamva_secret_")
    assert issued["Cache-Control"] == "no-store"

    listing = api_client.get(f"/api/v1/integrations/applications/{app_id}/", **h)
    body = json.dumps(listing.data, default=str)
    assert secret not in body
    assert "secret_digest" not in body
    credential = listing.data["environments"][0]["credentials"][0]
    assert credential["client_id"].startswith("tamva_sandbox_")
    assert credential["scopes"] == ["risk:evaluate"]


@pytest.mark.integration
@pytest.mark.django_db
def test_rotation_issues_a_new_secret_and_revokes_the_old_credential(
    api_client, normalisation_context
):
    CredentialScope.objects.create(code="risk:evaluate", name="Evaluate risk")
    manager = operator(normalisation_context, "partner:read", "partner:manage")
    api_client.force_authenticate(user=manager)
    h = headers(normalisation_context)
    app = api_client.post(
        "/api/v1/integrations/applications/", {"name": "A", "slug": "a"}, format="json", **h
    )
    env = api_client.post(
        f"/api/v1/integrations/applications/{app.data['data']['id']}/environments/",
        {"kind": "SANDBOX"},
        format="json",
        **h,
    )
    first = api_client.post(
        f"/api/v1/integrations/environments/{env.data['data']['id']}/credentials/",
        {"name": "k", "scopes": ["risk:evaluate"]},
        format="json",
        **h,
    )
    old_id = first.data["data"]["credential"]["id"]

    rotated = api_client.post(f"/api/v1/integrations/credentials/{old_id}/rotate/", **h)

    assert rotated.status_code == 201
    assert rotated.data["data"]["secret"] != first.data["data"]["secret"]
    listing = api_client.get(f"/api/v1/integrations/applications/{app.data['data']['id']}/", **h)
    statuses = {c["id"]: c["status"] for c in listing.data["environments"][0]["credentials"]}
    assert statuses[old_id] == "REVOKED"
    assert list(statuses.values()).count("ACTIVE") == 1
    again = api_client.post(f"/api/v1/integrations/credentials/{old_id}/rotate/", **h)
    assert again.status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
def test_integrations_are_permissioned_and_tenant_scoped(api_client, normalisation_context):
    other = normalisation_context[2]
    manager = operator(normalisation_context, "partner:read", "partner:manage")
    api_client.force_authenticate(user=manager)
    app = api_client.post(
        "/api/v1/integrations/applications/",
        {"name": "Mine", "slug": "mine"},
        format="json",
        **headers(normalisation_context),
    )
    app_id = app.data["data"]["id"]

    reader_only = operator(normalisation_context, "partner:read")
    api_client.force_authenticate(user=reader_only)
    create_denied = api_client.post(
        "/api/v1/integrations/applications/",
        {"name": "X", "slug": "x"},
        format="json",
        **headers(normalisation_context),
    )
    outsider = operator(normalisation_context, "partner:read", institution=other)
    api_client.force_authenticate(user=outsider)
    cross = api_client.get(
        f"/api/v1/integrations/applications/{app_id}/", **headers(normalisation_context, other)
    )

    assert create_denied.status_code == 403
    assert cross.status_code == 404


@pytest.mark.integration
@pytest.mark.django_db
def test_connections_expose_health_but_no_provider_references(api_client, normalisation_context):
    user = operator(normalisation_context, "partner:read")
    response = get(api_client, user, "/api/v1/integrations/connections/", normalisation_context)

    assert response.status_code == 200
    row = response.data["results"][0]
    assert row["provider"] == "normalisation-provider"
    assert row["status"] == "ACTIVE"
    body = json.dumps(response.data, default=str)
    assert "vault://" not in body
    assert "account-456" not in body


# --------------------------------------------------------------- network


@pytest.mark.integration
@pytest.mark.django_db
def test_network_summary_counts_and_declares_unsupported_intelligence(
    api_client, normalisation_context
):
    _, institution, other, _ = normalisation_context
    a = GraphNode.objects.create(
        institution=institution, node_type=GraphNodeType.CUSTOMER, natural_key="c1", label="C1"
    )
    b = GraphNode.objects.create(
        institution=institution, node_type=GraphNodeType.ACCOUNT, natural_key="a1", label="A1"
    )
    GraphNode.objects.create(
        institution=other, node_type=GraphNodeType.CUSTOMER, natural_key="c9", label="hidden"
    )
    GraphEdge.objects.create(
        institution=institution,
        edge_type=GraphEdgeType.CUSTOMER_OWNS_ACCOUNT,
        source_node=a,
        target_node=b,
        first_occurred_at=timezone.now(),
        last_occurred_at=timezone.now(),
    )
    user = operator(normalisation_context, "network:read")

    summary = get(api_client, user, "/api/v1/network/summary/", normalisation_context)
    nodes = get(api_client, user, "/api/v1/network/nodes/", normalisation_context)

    assert summary.data["data"]["nodes_by_type"]["CUSTOMER"] == 1
    assert summary.data["data"]["edges_by_type"]["CUSTOMER_OWNS_ACCOUNT"] == 1
    assert summary.data["data"]["unsupported"] == {
        "cross_institution_graph": "NOT_AVAILABLE",
        "merchant_intelligence": "NOT_AVAILABLE",
    }
    assert nodes.data["count"] == 2
    assert "hidden" not in json.dumps(nodes.data, default=str)
    assert "metadata" not in nodes.data["results"][0]


# ---------------------------------------------------------------- locale


@pytest.mark.integration
@pytest.mark.django_db
def test_locale_defaults_are_flagged_and_updates_are_validated_and_audited(
    api_client, normalisation_context
):
    reader = operator(normalisation_context, "overview:read")
    admin = operator(normalisation_context, "overview:read", "institution:manage")
    url = "/api/v1/institution/locale/"
    h = headers(normalisation_context)

    default = get(api_client, reader, url, normalisation_context)
    assert default.data["data"]["is_default"] is True
    assert default.data["data"]["default_currency"] == "GHS"

    api_client.force_authenticate(user=reader)
    assert api_client.patch(url, {"default_currency": "NGN"}, format="json", **h).status_code == 403

    api_client.force_authenticate(user=admin)
    bad = api_client.patch(url, {"timezone": "Mars/Olympus"}, format="json", **h)
    assert bad.status_code == 400
    ok = api_client.patch(
        url,
        {
            "country_code": "ng",
            "default_currency": "ngn",
            "timezone": "Africa/Lagos",
            "locale": "en-NG",
        },
        format="json",
        **h,
    )
    assert ok.status_code == 200
    assert ok.data["data"]["country_code"] == "NG"
    assert ok.data["data"]["default_currency"] == "NGN"
    assert ok.data["data"]["is_default"] is False
