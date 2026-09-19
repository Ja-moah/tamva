"""`Idempotency-Key` support for mutating bulk requests.

Same key + same body replays the stored response; same key + different body is
rejected, so a retry after a network failure can never apply an action twice.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Callable
from typing import Any

from django.db import IntegrityError, transaction
from rest_framework.exceptions import APIException
from rest_framework.request import Request
from rest_framework.response import Response

from domains.operations.models import IdempotencyRecord
from domains.partner.models import Institution

HEADER = "Idempotency-Key"
MAX_KEY_LENGTH = 128


class IdempotencyConflict(APIException):
    status_code = 409
    default_code = "idempotency_conflict"
    default_detail = "This Idempotency-Key was already used with a different request body."


def _hash(body: Any) -> str:
    canonical = json.dumps(body, sort_keys=True, default=str, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def run_idempotent(
    request: Request,
    *,
    endpoint: str,
    institution: Institution,
    body: Any,
    handler: Callable[[], dict[str, Any]],
) -> Response:
    """Run `handler` (which returns the JSON response body) at most once per key."""
    key = (request.headers.get(HEADER) or "").strip()
    if not key:
        return Response(handler())
    if len(key) > MAX_KEY_LENGTH:
        raise APIException(f"{HEADER} must be at most {MAX_KEY_LENGTH} characters.", "invalid")
    digest = _hash(body)
    lookup = {
        "actor": request.user,
        "institution": institution,
        "endpoint": endpoint,
        "key": key,
    }
    existing = IdempotencyRecord.objects.filter(**lookup).first()
    if existing is not None:
        if existing.request_hash != digest:
            raise IdempotencyConflict()
        replay = Response(existing.response, status=existing.status_code)
        replay["Idempotent-Replay"] = "true"
        return replay
    try:
        with transaction.atomic():
            payload = handler()
            IdempotencyRecord.objects.create(
                **lookup,
                request_hash=digest,
                response=json.loads(json.dumps(payload, default=str)),
                status_code=200,
            )
    except IntegrityError as exc:  # concurrent request with the same key won the race
        raise IdempotencyConflict("A request with this Idempotency-Key is in progress.") from exc
    return Response(payload)
