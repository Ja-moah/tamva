from __future__ import annotations

from config.celery import app
from domains.operations.exports import execute_export, purge_expired


@app.task(bind=True, acks_late=True)
def run_export_job(self: object, job_id: str) -> str:
    """Build one export artifact. Idempotent: a non-PENDING job is left alone."""
    return execute_export(job_id).status


@app.task(bind=True)
def purge_expired_exports(self: object) -> int:
    """Delete expired export artifacts; scheduled hourly by Celery beat."""
    return purge_expired()
