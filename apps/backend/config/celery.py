import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

app = Celery("tamva")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

from packages.observability import celery as _observability  # noqa: E402

_observability.connect()


@app.task(bind=True)
def diagnostic_ping(self: object) -> str:
    """Non-business task used to verify worker discovery and execution."""
    return "pong"
