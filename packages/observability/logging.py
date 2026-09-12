import logging

from packages.observability.context import request_id_var, tenant_id_var, user_id_var


class RequestContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        record.tenant_id = tenant_id_var.get()
        record.user_id = user_id_var.get()
        if not hasattr(record, "event"):
            record.event = "log"
        return True
