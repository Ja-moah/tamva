import io
import zipfile
from datetime import timedelta

import pytest
from django.core.files.storage import default_storage
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from domains.audit.models import AuditEvent
from domains.operations.exports import (
    execute_export,
    issue_download_token,
    purge_expired,
    request_export,
)
from domains.operations.models import ExportJob, SavedView
from tests.integration.admin_support import headers, operator
from tests.integration.test_case import block_risk_event, open_case_from_event_helper


@pytest.fixture(autouse=True)
def private_media(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path


def send(api_client, user, method, url, context, body=None, **params):
    api_client.force_authenticate(user=user)
    kwargs = {"format": "json"} if body is not None else {}
    return getattr(api_client, method)(
        url, body if body is not None else params, **kwargs, **headers(context)
    )


# ---------------------------------------------------------- saved views


@pytest.mark.integration
@pytest.mark.django_db
def test_saved_view_round_trip_and_privacy(api_client, normalisation_context):
    owner = operator(normalisation_context, "case:read")
    other = operator(normalisation_context, "case:read")
    body = {
        "resource_type": "CASES",
        "name": "Awaiting investigation",
        "filters": {"status": "TRIAGED", "unassigned": "true"},
        "ordering": "-priority",
        "visible_columns": ["reference", "priority"],
    }

    created = send(api_client, owner, "post", "/api/v1/saved-views/", normalisation_context, body)
    assert created.status_code == 201, created.data
    view_id = created.data["id"]

    mine = send(api_client, owner, "get", "/api/v1/saved-views/", normalisation_context)
    theirs = send(api_client, other, "get", "/api/v1/saved-views/", normalisation_context)
    stolen = send(
        api_client, other, "get", f"/api/v1/saved-views/{view_id}/", normalisation_context
    )
    assert [v["name"] for v in mine.data["results"]] == ["Awaiting investigation"]
    assert theirs.data["results"] == []
    assert stolen.status_code == 404

    patched = send(
        api_client,
        owner,
        "patch",
        f"/api/v1/saved-views/{view_id}/",
        normalisation_context,
        {"filters": {"status": "OPEN"}},
    )
    assert patched.data["filters"] == {"status": "OPEN"}
    deleted = send(
        api_client, owner, "delete", f"/api/v1/saved-views/{view_id}/", normalisation_context
    )
    assert deleted.status_code == 204


@pytest.mark.integration
@pytest.mark.django_db
def test_saved_view_filters_are_validated_not_trusted(api_client, normalisation_context):
    owner = operator(normalisation_context, "case:read")
    url = "/api/v1/saved-views/"

    def create(**overrides):
        body = {"resource_type": "CASES", "name": "v", "filters": {}, **overrides}
        return send(api_client, owner, "post", url, normalisation_context, body)

    assert create(filters={"status": "NEW"}).status_code == 400  # not a backend state
    assert create(filters={"customer__password__startswith": "a"}).status_code == 400
    assert create(filters={"status": {"$ne": "x"}}).status_code == 400
    assert create(ordering="customer__password").status_code == 400
    assert create(visible_columns=["not_a_column"]).status_code == 400
    assert create(resource_type="NOPE").status_code == 400
    assert create().status_code == 201
    assert create().status_code == 400  # duplicate name for this owner/resource
    assert SavedView.objects.count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_saved_view_requires_read_access_to_the_resource(api_client, normalisation_context):
    analyst = operator(normalisation_context, "risk:read")
    response = send(
        api_client,
        analyst,
        "post",
        "/api/v1/saved-views/",
        normalisation_context,
        {"resource_type": "CASES", "name": "x", "filters": {}},
    )
    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.django_db
def test_resource_catalog_lists_only_what_the_actor_may_use(api_client, normalisation_context):
    analyst = operator(normalisation_context, "risk:read", "customer:read")
    response = send(api_client, analyst, "get", "/api/v1/resources/", normalisation_context)
    catalog = {r["resource_type"]: r for r in response.data["data"]}

    assert set(catalog) == {"RISK_EVENTS", "CUSTOMERS", "NOTIFICATIONS"}
    columns = [c["key"] for c in catalog["CUSTOMERS"]["columns"]]
    assert "active_passport_shares" not in columns  # needs passport:read
    assert "decision" in [f["param"] for f in catalog["RISK_EVENTS"]["filters"]]


# -------------------------------------------------------------- exports


@pytest.fixture
def case_export_context(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])
    user = operator(normalisation_context, "case:read", "export:manage")
    return normalisation_context, case, user


def request_via_api(api_client, user, context, capture, **body):
    payload = {"resource_type": "CASES", "format": "CSV", **body}
    with capture(execute=True):
        return send(api_client, user, "post", "/api/v1/exports/", context, payload)


@pytest.mark.integration
@pytest.mark.django_db
def test_export_lifecycle_request_build_link_download(
    api_client, case_export_context, django_capture_on_commit_callbacks
):
    context, case, user = case_export_context

    response = request_via_api(
        api_client,
        user,
        context,
        django_capture_on_commit_callbacks,
        filters={"status": "OPEN"},
        columns=["reference", "priority"],
    )

    assert response.status_code == 202, response.data
    job = ExportJob.objects.get(pk=response.data["data"]["id"])
    assert job.status == ExportJob.Status.COMPLETED
    assert job.row_count == 1
    assert job.expires_at > timezone.now()

    link = send(api_client, user, "post", f"/api/v1/exports/{job.id}/download-link/", context, None)
    assert link.status_code == 200
    token = link.data["data"]["token"]
    download = send(
        api_client, user, "get", f"/api/v1/exports/{job.id}/download/", context, token=token
    )
    assert download.status_code == 200
    assert download["Cache-Control"] == "no-store"
    text = b"".join(download.streaming_content).decode("utf-8-sig")
    assert text.splitlines()[0] == "Reference,Priority"
    assert case.reference in text
    actions = set(AuditEvent.objects.values_list("action", flat=True))
    assert {"EXPORT_REQUESTED", "EXPORT_COMPLETED", "EXPORT_DOWNLOADED"} <= actions


@pytest.mark.integration
@pytest.mark.django_db
def test_download_requires_a_valid_token_bound_to_the_requester(
    api_client, case_export_context, django_capture_on_commit_callbacks, settings
):
    context, _case, user = case_export_context
    other = operator(context, "case:read", "export:manage")
    job_id = request_via_api(api_client, user, context, django_capture_on_commit_callbacks).data[
        "data"
    ]["id"]
    job = ExportJob.objects.get(pk=job_id)
    url = f"/api/v1/exports/{job_id}/download/"

    no_token = send(api_client, user, "get", url, context)
    forged = send(api_client, user, "get", url, context, token="forged")
    borrowed = send(api_client, other, "get", url, context, token=issue_download_token(job, user))
    valid = issue_download_token(job, user)
    settings.EXPORT_LINK_TTL_SECONDS = -1
    expired = send(api_client, user, "get", url, context, token=valid)

    assert no_token.status_code == forged.status_code == 403
    assert borrowed.status_code == 404  # jobs are private to their requester
    assert expired.status_code == 403


@pytest.mark.integration
@pytest.mark.django_db
def test_export_needs_both_the_resource_permission_and_export_manage(
    api_client, normalisation_context, django_capture_on_commit_callbacks
):
    block_risk_event(normalisation_context)
    no_export = operator(normalisation_context, "case:read")
    no_resource = operator(normalisation_context, "export:manage")

    a = request_via_api(
        api_client, no_export, normalisation_context, django_capture_on_commit_callbacks
    )
    b = request_via_api(
        api_client, no_resource, normalisation_context, django_capture_on_commit_callbacks
    )

    assert a.status_code == b.status_code == 403
    assert ExportJob.objects.count() == 0


@pytest.mark.integration
@pytest.mark.django_db
def test_export_rejects_bad_filters_and_unavailable_columns_without_creating_a_job(
    api_client, normalisation_context, django_capture_on_commit_callbacks
):
    user = operator(normalisation_context, "customer:read", "export:manage")
    capture = django_capture_on_commit_callbacks

    bad_filter = request_via_api(
        api_client,
        user,
        normalisation_context,
        capture,
        resource_type="CUSTOMERS",
        filters={"nope": "1"},
    )
    hidden = request_via_api(
        api_client,
        user,
        normalisation_context,
        capture,
        resource_type="CUSTOMERS",
        columns=["active_passport_shares"],
    )
    unknown = request_via_api(
        api_client,
        user,
        normalisation_context,
        capture,
        resource_type="CUSTOMERS",
        columns=["email"],  # only the masked column exists
    )

    assert bad_filter.status_code == hidden.status_code == unknown.status_code == 400
    assert ExportJob.objects.count() == 0


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_export_never_contains_raw_email(
    api_client, normalisation_context, django_capture_on_commit_callbacks
):
    user = operator(normalisation_context, "customer:read", "export:manage")
    response = request_via_api(
        api_client,
        user,
        normalisation_context,
        django_capture_on_commit_callbacks,
        resource_type="CUSTOMERS",
    )
    job = ExportJob.objects.get(pk=response.data["data"]["id"])
    content = default_storage.open(job.artifact.name).read().decode("utf-8-sig")

    assert job.status == ExportJob.Status.COMPLETED
    assert normalisation_context[0].email not in content
    assert "n***@example.test" in content


@pytest.mark.integration
@pytest.mark.django_db
def test_xlsx_export_is_a_valid_workbook(
    api_client, case_export_context, django_capture_on_commit_callbacks
):
    context, case, user = case_export_context
    response = request_via_api(
        api_client, user, context, django_capture_on_commit_callbacks, format="XLSX"
    )
    job = ExportJob.objects.get(pk=response.data["data"]["id"])
    with zipfile.ZipFile(io.BytesIO(default_storage.open(job.artifact.name).read())) as archive:
        assert archive.testzip() is None
        assert case.reference.encode() in archive.read("xl/worksheets/sheet1.xml")


@pytest.mark.integration
@pytest.mark.django_db
def test_selected_ids_limit_the_export(
    api_client, normalisation_context, django_capture_on_commit_callbacks
):
    first = open_case_from_event_helper(
        block_risk_event(normalisation_context, suffix="s1"), normalisation_context[1]
    )
    open_case_from_event_helper(
        block_risk_event(normalisation_context, suffix="s2"), normalisation_context[1]
    )
    user = operator(normalisation_context, "case:read", "export:manage")

    response = request_via_api(
        api_client,
        user,
        normalisation_context,
        django_capture_on_commit_callbacks,
        selected_ids=[str(first.id)],
    )

    assert ExportJob.objects.get(pk=response.data["data"]["id"]).row_count == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_permission_is_rechecked_when_the_job_runs(case_export_context):
    context, _case, user = case_export_context
    job = request_export(
        institution=context[1],
        actor=user,
        resource_key="CASES",
        file_format="CSV",
        filters={},
        ordering="",
        columns=[],
        selected_ids=[],
    )
    assert job.status == ExportJob.Status.PENDING  # on_commit never fired in this test
    for membership in user.institution_memberships.all():
        membership.roles.clear()

    result = execute_export(job.id)

    assert result.status == ExportJob.Status.FAILED
    assert result.error_code == "PERMISSION_REVOKED"
    assert not result.artifact


@pytest.mark.integration
@pytest.mark.django_db
def test_oversized_exports_fail_instead_of_truncating(case_export_context, settings):
    context, _case, user = case_export_context
    settings.EXPORT_MAX_ROWS = 0
    job = request_export(
        institution=context[1],
        actor=user,
        resource_key="CASES",
        file_format="CSV",
        filters={},
        ordering="",
        columns=[],
        selected_ids=[],
    )

    result = execute_export(job.id)

    assert result.status == ExportJob.Status.FAILED
    assert result.error_code == "EXPORT_TOO_LARGE"


@pytest.mark.integration
@pytest.mark.django_db
def test_expired_exports_are_purged_and_can_no_longer_be_downloaded(
    api_client, case_export_context, django_capture_on_commit_callbacks
):
    context, _case, user = case_export_context
    job_id = request_via_api(api_client, user, context, django_capture_on_commit_callbacks).data[
        "data"
    ]["id"]
    job = ExportJob.objects.get(pk=job_id)
    path = job.artifact.name
    assert default_storage.exists(path)
    ExportJob.objects.filter(pk=job_id).update(expires_at=timezone.now() - timedelta(minutes=1))

    assert purge_expired() == 1

    job.refresh_from_db()
    assert job.status == ExportJob.Status.EXPIRED
    assert not default_storage.exists(path)
    link = send(api_client, user, "post", f"/api/v1/exports/{job_id}/download-link/", context, None)
    assert link.status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
def test_unknown_resource_is_a_validation_error(case_export_context):
    context, _case, user = case_export_context
    with pytest.raises(ValidationError):
        request_export(
            institution=context[1],
            actor=user,
            resource_key="NOPE",
            file_format="CSV",
            filters={},
            ordering="",
            columns=[],
            selected_ids=[],
        )


# ------------------------------------------------- reliability: never stuck


def _pending_job(context, user):
    return request_export(
        institution=context[1],
        actor=user,
        resource_key="CASES",
        file_format="CSV",
        filters={},
        ordering="",
        columns=[],
        selected_ids=[],
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_a_storage_failure_fails_the_job_instead_of_leaving_it_running(
    case_export_context, monkeypatch
):
    context, _case, user = case_export_context
    job = _pending_job(context, user)

    def boom(*_args, **_kwargs):
        raise OSError("bucket unreachable")

    monkeypatch.setattr("django.db.models.fields.files.FieldFile.save", boom)

    result = execute_export(job.id)

    assert result.status == ExportJob.Status.FAILED
    assert result.error_code == "EXPORT_ERROR"
    assert "bucket" not in result.error_code  # internals never reach the client field
    assert AuditEvent.objects.filter(action="EXPORT_FAILED").exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_soft_time_limit_fails_the_job_with_a_timeout_code(case_export_context, monkeypatch):
    from celery.exceptions import SoftTimeLimitExceeded

    context, _case, user = case_export_context
    job = _pending_job(context, user)
    monkeypatch.setattr(
        "domains.operations.exports._build_artifact",
        lambda _job: (_ for _ in ()).throw(SoftTimeLimitExceeded()),
    )

    assert execute_export(job.id).error_code == "EXPORT_TIMEOUT"


@pytest.mark.integration
@pytest.mark.django_db
def test_stale_pending_and_running_exports_are_failed_but_fresh_ones_are_not(
    case_export_context, settings
):
    from domains.operations.exports import fail_stale

    context, _case, user = case_export_context
    stale_pending, stale_running, fresh = (_pending_job(context, user) for _ in range(3))
    old = timezone.now() - timedelta(minutes=settings.EXPORT_STALE_MINUTES + 1)
    ExportJob.objects.filter(pk=stale_pending.pk).update(updated_at=old)
    ExportJob.objects.filter(pk=stale_running.pk).update(
        updated_at=old, status=ExportJob.Status.RUNNING
    )

    assert fail_stale() == 2

    codes = {j.pk: (j.status, j.error_code) for j in ExportJob.objects.all()}
    assert codes[stale_pending.pk] == (ExportJob.Status.FAILED, "EXPORT_STALE")
    assert codes[stale_running.pk] == (ExportJob.Status.FAILED, "EXPORT_TIMEOUT")
    assert codes[fresh.pk][0] == ExportJob.Status.PENDING


@pytest.mark.integration
@pytest.mark.django_db
def test_a_broker_outage_does_not_break_the_export_request(
    api_client, case_export_context, django_capture_on_commit_callbacks, monkeypatch
):
    context, _case, user = case_export_context

    def down(*_args, **_kwargs):
        raise ConnectionError("broker down")

    monkeypatch.setattr("domains.operations.tasks.run_export_job.delay", down)

    response = request_via_api(api_client, user, context, django_capture_on_commit_callbacks)

    assert response.status_code == 202
    assert ExportJob.objects.get(pk=response.data["data"]["id"]).status == ExportJob.Status.PENDING


@pytest.mark.integration
@pytest.mark.django_db
def test_export_artifacts_are_stored_under_the_institution_prefix(case_export_context):
    context, _case, user = case_export_context
    job = execute_export(_pending_job(context, user).id)

    assert job.artifact.name.startswith(f"exports/{context[1].id}/")
    assert job.artifact.name.endswith(f"{job.id}.csv")
