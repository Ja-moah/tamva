"""Controlled, asynchronous data export.

Requesting an export never returns data. It records an `ExportJob` (who asked,
for what, with which filters and columns), a worker builds the file later, and
the file is fetched through a permission-checked, audited download that also
requires a short-lived signed token. Permissions are checked both when the job
is requested and again when it runs, so a revoked role cannot export.
"""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any
from uuid import UUID

from celery.exceptions import SoftTimeLimitExceeded
from django.conf import settings
from django.core import signing
from django.core.exceptions import PermissionDenied
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from domains.audit.models import AuditEvent
from domains.audit.services import record_audit
from domains.identity.models import User
from domains.operations import writers
from domains.operations.models import ExportJob
from domains.operations.resources import RESOURCES, Resource, can_read
from domains.partner.models import Institution
from packages.common.filtering import apply_filters, validate_params

logger = logging.getLogger(__name__)

MAX_SELECTED_IDS = 1000
_TOKEN_SALT = "tamva.exports.download"


def validate_query(resource: Resource, filters: Any, ordering: str) -> dict[str, str]:
    """Validate filters/ordering against the resource allow-list and return the
    cleaned `{param: str}` filters, using the same rules as a live list request."""
    if not isinstance(filters, dict):
        raise ValidationError({"filters": ["Must be an object of filter parameters."]})
    cleaned: dict[str, str] = {}
    for key, value in filters.items():
        if str(key) == "ordering":
            raise ValidationError({"filters": ["Use the `ordering` field, not a filter."]})
        if not isinstance(value, str | int | float | bool) or len(str(value)) > 200:
            raise ValidationError({"filters": [f"Invalid value for '{key}'."]})
        cleaned[str(key)] = str(value).lower() if isinstance(value, bool) else str(value)
    validate_params(
        {**cleaned, **({"ordering": ordering} if ordering else {})},
        specs=resource.filters,
        search=resource.search,
        ordering_fields=resource.ordering,
    )
    return cleaned


def validate_columns(
    resource: Resource, actor: User, institution_id: UUID, requested: list[str]
) -> list[str]:
    allowed = {c.key: c for c in resource.allowed_columns(actor, institution_id)}
    if not requested:
        return list(allowed)
    unknown = [key for key in requested if key not in allowed]
    if unknown:
        raise ValidationError(
            {"columns": [f"Unavailable columns: {', '.join(sorted(set(unknown)))}."]}
        )
    return list(dict.fromkeys(requested))


def request_export(
    *,
    institution: Institution,
    actor: User,
    resource_key: str,
    file_format: str,
    filters: Any,
    ordering: str,
    columns: list[str],
    selected_ids: list[UUID],
) -> ExportJob:
    resource = RESOURCES.get(resource_key)
    if resource is None:
        raise ValidationError({"resource_type": ["Unsupported resource."]})
    if not can_read(resource, actor, institution.id):
        raise PermissionDenied("You cannot export a resource you are not allowed to view.")
    if len(selected_ids) > MAX_SELECTED_IDS:
        raise ValidationError({"selected_ids": [f"At most {MAX_SELECTED_IDS} ids."]})
    cleaned = validate_query(resource, filters, ordering)
    chosen = validate_columns(resource, actor, institution.id, columns)
    with transaction.atomic():
        job = ExportJob.objects.create(
            institution=institution,
            requested_by=actor,
            resource_type=resource_key,
            format=file_format,
            filters=cleaned,
            ordering=ordering,
            columns=chosen,
            selected_ids=[str(pk) for pk in selected_ids],
            expires_at=timezone.now() + timedelta(hours=settings.EXPORT_RETENTION_HOURS),
        )
        record_audit(
            action="EXPORT_REQUESTED",
            actor=actor,
            institution=institution,
            metadata={
                "export_id": str(job.id),
                "resource": resource_key,
                "format": file_format,
                "filters": sorted(cleaned),
                "selected": len(selected_ids),
            },
        )
        from domains.operations.tasks import run_export_job

        transaction.on_commit(lambda: _enqueue(run_export_job, str(job.id)))
    return job


def _enqueue(task: Any, job_id: str) -> None:
    """A broker outage must not turn a committed request into a 500. The job stays
    PENDING and `fail_stale_exports` closes it out if nothing ever picks it up."""
    try:
        task.delay(job_id)
    except Exception:
        logger.exception("export_enqueue_failed", extra={"export_id": job_id})


def _fail(job: ExportJob, code: str) -> ExportJob:
    job.status = ExportJob.Status.FAILED
    job.error_code = code
    job.completed_at = timezone.now()
    job.save(update_fields=["status", "error_code", "completed_at", "updated_at"])
    record_audit(
        action="EXPORT_FAILED",
        outcome=AuditEvent.Outcome.FAILURE,
        actor=job.requested_by,
        institution=job.institution,
        metadata={"export_id": str(job.id), "code": code},
    )
    return job


def execute_export(job_id: UUID | str) -> ExportJob:
    """Build the artifact. Safe to call twice: only a PENDING job runs."""
    with transaction.atomic():
        job = (
            ExportJob.objects.select_for_update()
            .select_related("institution", "requested_by")
            .get(pk=job_id)
        )
        if job.status != ExportJob.Status.PENDING:
            return job
        job.status = ExportJob.Status.RUNNING
        job.save(update_fields=["status", "updated_at"])

    try:
        return _build_artifact(job)
    except SoftTimeLimitExceeded:
        return _fail(job, "EXPORT_TIMEOUT")
    except Exception:
        # Whatever went wrong (storage outage, bad data), the job ends FAILED with a
        # code rather than stuck RUNNING; details go to the log, not to the client.
        logger.exception("export_failed", extra={"export_id": str(job.id)})
        return _fail(job, "EXPORT_ERROR")


def _build_artifact(job: ExportJob) -> ExportJob:
    resource = RESOURCES[job.resource_type]
    actor, institution_id = job.requested_by, job.institution_id
    # Re-check at execution time: the actor may have lost access since the request.
    if not can_read(resource, actor, institution_id):
        return _fail(job, "PERMISSION_REVOKED")
    columns = [c for c in resource.allowed_columns(actor, institution_id) if c.key in job.columns]
    if len(columns) != len(job.columns):
        return _fail(job, "COLUMN_PERMISSION_REVOKED")

    params = dict(job.filters)
    if job.ordering:
        params["ordering"] = job.ordering
    queryset = apply_filters(
        resource.queryset(institution_id, actor),
        params,
        specs=resource.filters,
        search=resource.search,
        ordering_fields=resource.ordering,
        default_ordering=resource.default_ordering,
    )
    if job.selected_ids:
        queryset = queryset.filter(pk__in=job.selected_ids)

    limit = settings.EXPORT_MAX_ROWS
    objects = list(queryset[: limit + 1])
    if len(objects) > limit:
        return _fail(job, "EXPORT_TOO_LARGE")

    header = [c.label for c in columns]
    rows = [[c.getter(obj) for c in columns] for obj in objects]
    content = (
        writers.write_xlsx(header, rows)
        if job.format == ExportJob.Format.XLSX
        else writers.write_csv(header, rows)
    )
    extension = "xlsx" if job.format == ExportJob.Format.XLSX else "csv"
    job.artifact.save(f"{institution_id}/{job.id}.{extension}", ContentFile(content), save=False)
    job.artifact_size = len(content)
    job.row_count = len(rows)
    job.status = ExportJob.Status.COMPLETED
    job.completed_at = timezone.now()
    job.save()
    record_audit(
        action="EXPORT_COMPLETED",
        actor=actor,
        institution=job.institution,
        metadata={"export_id": str(job.id), "rows": job.row_count},
    )
    return job


def issue_download_token(job: ExportJob, actor: User) -> str:
    """A short-lived token bound to this job and this user."""
    return signing.dumps({"job": str(job.id), "user": str(actor.id)}, salt=_TOKEN_SALT)


def verify_download_token(token: str, job: ExportJob, actor: User) -> bool:
    try:
        payload = signing.loads(token, salt=_TOKEN_SALT, max_age=settings.EXPORT_LINK_TTL_SECONDS)
    except signing.BadSignature:
        return False
    return payload == {"job": str(job.id), "user": str(actor.id)}


def fail_stale(now: Any = None) -> int:
    """Close out exports that can never finish (lost message, killed worker, broker
    outage). A job is never left PENDING or RUNNING indefinitely."""
    moment = now or timezone.now()
    cutoff = moment - timedelta(minutes=settings.EXPORT_STALE_MINUTES)
    stale = ExportJob.objects.filter(
        status__in=[ExportJob.Status.PENDING, ExportJob.Status.RUNNING], updated_at__lte=cutoff
    ).select_related("institution", "requested_by")
    failed = 0
    for job in stale:
        code = "EXPORT_STALE" if job.status == ExportJob.Status.PENDING else "EXPORT_TIMEOUT"
        _fail(job, code)
        failed += 1
    return failed


def purge_expired(now: Any = None) -> int:
    """Delete artifacts past their retention and mark the jobs EXPIRED."""
    moment = now or timezone.now()
    purged = 0
    for job in ExportJob.objects.filter(expires_at__lte=moment).exclude(
        status=ExportJob.Status.EXPIRED
    ):
        if job.artifact:
            job.artifact.delete(save=False)
        job.status = ExportJob.Status.EXPIRED
        job.artifact = ""
        job.save(update_fields=["status", "artifact", "updated_at"])
        purged += 1
    return purged
