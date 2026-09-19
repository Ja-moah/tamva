import logging

from packages.observability.context import request_id_var, tenant_id_var, user_id_var


class RequestContextFilter(logging.Filter):
    """Adds request/tenant/user ids from context. Values a caller set explicitly on the
    record (e.g. the request-completion line, logged after context is reset) win."""

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "request_id"):
            record.request_id = request_id_var.get()
        if not getattr(record, "tenant_id", ""):
            record.tenant_id = tenant_id_var.get()
        if not getattr(record, "user_id", ""):
            record.user_id = user_id_var.get()
        if not hasattr(record, "event"):
            record.event = "log"
        return True
