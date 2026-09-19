import json
import logging

import pytest
from django.test import Client

from packages.observability.context import request_id_var


@pytest.mark.unit
@pytest.mark.django_db
@pytest.mark.parametrize("bad", ["a b", "x" * 129, "id;drop", "línea", "a\tb"])
def test_unsafe_request_ids_are_replaced(api_client, bad) -> None:
    response = api_client.get("/health/", HTTP_X_REQUEST_ID=bad)
    assert response["X-Request-ID"] != bad
    assert len(response["X-Request-ID"]) == 36  # generated uuid


@pytest.mark.unit
@pytest.mark.django_db
def test_request_completion_is_logged_without_the_query_string(api_client, caplog) -> None:
    with caplog.at_level(logging.INFO, logger="tamva.request"):
        api_client.get("/api/v1/meta/version/?token=super-secret", HTTP_X_REQUEST_ID="trace-1")
    record = next(r for r in caplog.records if r.getMessage() == "request_completed")
    assert record.path == "/api/v1/meta/version/"
    assert record.status == 200
    assert record.duration_ms >= 0
    assert "super-secret" not in json.dumps(record.__dict__, default=str)


@pytest.mark.unit
@pytest.mark.django_db
def test_health_probes_are_not_logged_at_info(api_client, caplog) -> None:
    with caplog.at_level(logging.INFO, logger="tamva.request"):
        api_client.get("/health/live/")
    assert not [r for r in caplog.records if r.getMessage() == "request_completed"]


@pytest.mark.unit
def test_celery_tasks_inherit_the_publishing_request_id() -> None:
    from packages.observability import celery as obs

    headers: dict[str, str] = {}
    token = request_id_var.set("req-abc")
    try:
        obs._before_task_publish(headers=headers)
    finally:
        request_id_var.reset(token)
    assert headers == {"request_id": "req-abc"}

    class Task:
        request = type("R", (), {"request_id": "req-abc"})()

    obs._task_prerun(task_id="t1", task=Task())
    assert request_id_var.get() == "req-abc"
    obs._task_postrun(task_id="t1")
    assert request_id_var.get() == ""


@pytest.mark.unit
def test_celery_tasks_without_a_request_get_a_task_scoped_id() -> None:
    from packages.observability import celery as obs

    class Task:
        request = type("R", (), {})()

    obs._task_prerun(task_id="t2", task=Task())
    assert request_id_var.get() == "task-t2"
    obs._task_postrun(task_id="t2")
    assert request_id_var.get() == ""


@pytest.mark.unit
@pytest.mark.django_db
def test_unknown_urls_return_the_json_envelope(api_client) -> None:
    response = api_client.get("/no/such/route/", HTTP_X_REQUEST_ID="trace-404")
    assert response.status_code == 404
    assert response["Content-Type"] == "application/json"
    assert response.json()["error"]["code"] == "not_found"


@pytest.mark.unit
@pytest.mark.django_db
def test_unhandled_errors_return_a_json_500_with_the_request_id(monkeypatch) -> None:
    def explode(*_args, **_kwargs):
        raise RuntimeError("database password is hunter2")

    monkeypatch.setattr("packages.common.views.VersionView.get", explode)

    response = Client(raise_request_exception=False).get(
        "/api/v1/meta/version/", HTTP_X_REQUEST_ID="trace-500"
    )

    assert response.status_code == 500
    body = response.json()["error"]
    assert body["code"] == "server_error"
    assert body["request_id"] == "trace-500"
    assert "hunter2" not in response.content.decode()
