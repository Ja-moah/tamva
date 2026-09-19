"""Carries the originating request id into Celery tasks so one id follows a request
from the API into the worker logs."""

from __future__ import annotations

import uuid
from typing import Any

from celery import signals

from packages.observability.context import request_id_var

_HEADER = "request_id"
_TOKENS: dict[str, Any] = {}


def _before_task_publish(headers: dict[str, Any] | None = None, **_: Any) -> None:
    request_id = request_id_var.get()
    if headers is not None and request_id:
        headers[_HEADER] = request_id


def _task_prerun(task_id: str | None = None, task: Any = None, **_: Any) -> None:
    request = getattr(task, "request", None)
    # Custom message headers surface as attributes on the task request context.
    inherited = getattr(request, _HEADER, None)
    _TOKENS[str(task_id)] = request_id_var.set(inherited or f"task-{task_id or uuid.uuid4()}")


def _task_postrun(task_id: str | None = None, **_: Any) -> None:
    token = _TOKENS.pop(str(task_id), None)
    if token is not None:
        request_id_var.reset(token)


def connect() -> None:
    signals.before_task_publish.connect(_before_task_publish, weak=False)
    signals.task_prerun.connect(_task_prerun, weak=False)
    signals.task_postrun.connect(_task_postrun, weak=False)
