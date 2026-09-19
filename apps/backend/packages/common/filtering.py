"""Declarative, allow-listed list filtering and ordering.

Every operational list endpoint declares its filters as data (`FilterSpec`) and
its sortable fields as an allow-list. Nothing from the query string is ever
interpreted as an expression: a value is parsed into a typed Python value and
applied to one fixed ORM lookup. Unknown parameters are rejected rather than
silently ignored, so a client typo cannot return an unfiltered dataset.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime, time
from decimal import Decimal, InvalidOperation
from typing import Any, Literal
from uuid import UUID

from django.db.models import Q, QuerySet
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter
from rest_framework.exceptions import ValidationError

Kind = Literal["str", "int", "decimal", "date", "datetime", "uuid", "bool", "choice"]

# Parameters owned by pagination / ordering, never treated as filters.
RESERVED_PARAMS = frozenset({"page", "page_size", "ordering"})

_OPENAPI_TYPES: dict[str, Any] = {
    "str": OpenApiTypes.STR,
    "int": OpenApiTypes.INT,
    "decimal": OpenApiTypes.DECIMAL,
    "date": OpenApiTypes.DATE,
    "datetime": OpenApiTypes.DATETIME,
    "uuid": OpenApiTypes.UUID,
    "bool": OpenApiTypes.BOOL,
    "choice": OpenApiTypes.STR,
}


@dataclass(frozen=True, slots=True)
class FilterSpec:
    """One accepted query parameter mapped to one fixed ORM lookup."""

    param: str
    field: str
    kind: Kind = "str"
    lookup: str = "exact"
    choices: tuple[str, ...] = ()
    description: str = ""
    # Set when `field` crosses a to-many relation and could repeat rows.
    distinct: bool = False


@dataclass(frozen=True, slots=True)
class SearchSpec:
    """`?search=` matches case-insensitively across a fixed set of fields."""

    fields: tuple[str, ...]
    param: str = "search"


def _parse(spec: FilterSpec, raw: str) -> Any:
    try:
        if spec.kind == "str":
            return raw
        if spec.kind == "choice":
            if raw not in spec.choices:
                raise ValueError(f"must be one of: {', '.join(spec.choices)}")
            return raw
        if spec.kind == "int":
            return int(raw)
        if spec.kind == "decimal":
            return Decimal(raw)
        if spec.kind == "uuid":
            return UUID(raw)
        if spec.kind == "bool":
            lowered = raw.lower()
            if lowered in {"true", "1"}:
                return True
            if lowered in {"false", "0"}:
                return False
            raise ValueError("must be true or false")
        if spec.kind == "date":
            parsed_date = parse_date(raw)
            if parsed_date is None:
                raise ValueError("must be an ISO date (YYYY-MM-DD)")
            return parsed_date
        if spec.kind == "datetime":
            parsed = parse_datetime(raw)
            if parsed is not None:
                return parsed if timezone.is_aware(parsed) else timezone.make_aware(parsed)
            parsed_date = parse_date(raw)
            if parsed_date is None:
                raise ValueError("must be an ISO 8601 datetime or date")
            # A bare date bound is interpreted in UTC so results are reproducible.
            return datetime.combine(parsed_date, time.min, tzinfo=UTC)
    except (ValueError, InvalidOperation) as exc:
        raise ValidationError({spec.param: [str(exc) or "invalid value"]}) from exc
    raise ValueError(f"unsupported filter kind {spec.kind}")  # pragma: no cover


def _end_of_day(spec: FilterSpec, value: Any, raw: str) -> Any:
    """An upper bound given as a bare date includes that whole day."""
    if spec.kind == "datetime" and spec.lookup == "lte" and len(raw) == 10:
        return value.replace(hour=23, minute=59, second=59, microsecond=999999)
    return value


def _ordering_paths(raw: str, ordering_fields: Mapping[str, str]) -> list[str]:
    paths: list[str] = []
    for part in raw.split(","):
        name = part.strip()
        if not name:
            continue
        path = ordering_fields.get(name.lstrip("-"))
        if path is None:
            allowed = ", ".join(sorted(ordering_fields))
            raise ValidationError(
                {"ordering": [f"Cannot order by '{name.lstrip('-')}'. Allowed: {allowed}."]}
            )
        paths.append(f"-{path}" if name.startswith("-") else path)
    return paths


def validate_params(
    params: Mapping[str, str],
    *,
    specs: Sequence[FilterSpec],
    search: SearchSpec | None = None,
    ordering_fields: Mapping[str, str],
) -> None:
    """Raise ValidationError for unknown params, malformed values or bad ordering.

    Runs no database work, so it can validate stored filters (saved views,
    export requests) exactly as a live list request would be validated.
    """
    by_param = {spec.param: spec for spec in specs}
    allowed = set(by_param) | RESERVED_PARAMS | ({search.param} if search else set())
    unknown = sorted(set(params) - allowed)
    if unknown:
        raise ValidationError({name: ["Unknown filter parameter."] for name in unknown})
    for param, raw in params.items():
        spec = by_param.get(param)
        if spec is not None and raw != "":
            _parse(spec, raw)
    _ordering_paths(params.get("ordering") or "", ordering_fields)


def apply_filters(
    queryset: QuerySet[Any],
    params: Mapping[str, str],
    *,
    specs: Sequence[FilterSpec],
    search: SearchSpec | None = None,
    ordering_fields: Mapping[str, str],
    default_ordering: Sequence[str],
) -> QuerySet[Any]:
    """Apply validated filters, search and ordering to `queryset`.

    `ordering_fields` maps the public sort name to an ORM field path. A leading
    `-` on the public name reverses it. Ties are broken by `default_ordering`
    so pagination is stable.
    """
    validate_params(params, specs=specs, search=search, ordering_fields=ordering_fields)
    by_param = {spec.param: spec for spec in specs}

    needs_distinct = False
    for param, raw in params.items():
        spec = by_param.get(param)
        if spec is None or raw == "":
            continue
        value = _end_of_day(spec, _parse(spec, raw), raw)
        queryset = queryset.filter(**{f"{spec.field}__{spec.lookup}": value})
        needs_distinct = needs_distinct or spec.distinct

    if search and params.get(search.param):
        term = params[search.param].strip()
        if term:
            condition = Q()
            for field in search.fields:
                condition |= Q(**{f"{field}__icontains": term})
            queryset = queryset.filter(condition)

    ordering = _ordering_paths(params.get("ordering") or "", ordering_fields)
    queryset = queryset.order_by(*ordering, *default_ordering)
    return queryset.distinct() if needs_distinct else queryset


def filter_parameters(
    specs: Sequence[FilterSpec],
    *,
    search: SearchSpec | None = None,
    ordering_fields: Mapping[str, str] | None = None,
) -> list[OpenApiParameter]:
    """OpenAPI parameters generated from the same declaration that enforces them."""
    parameters = [
        OpenApiParameter(
            name=spec.param,
            type=_OPENAPI_TYPES[spec.kind],
            required=False,
            enum=list(spec.choices) or None,
            description=spec.description,
        )
        for spec in specs
    ]
    if search:
        parameters.append(
            OpenApiParameter(
                name=search.param,
                type=OpenApiTypes.STR,
                required=False,
                description=f"Case-insensitive match across: {', '.join(search.fields)}.",
            )
        )
    if ordering_fields:
        parameters.append(
            OpenApiParameter(
                name="ordering",
                type=OpenApiTypes.STR,
                required=False,
                description=(
                    "Comma-separated sort fields; prefix `-` for descending. "
                    f"Allowed: {', '.join(sorted(ordering_fields))}."
                ),
            )
        )
    return parameters


def query_params_dict(request: Any) -> dict[str, str]:
    """Flatten a QueryDict to the last value per key (repeated keys are not filters)."""
    return {key: request.query_params.get(key, "") for key in request.query_params}


class FilteredListMixin:
    """Applies the declared filters to `list` (DRF calls `filter_queryset` there)."""

    filter_specs: Sequence[FilterSpec] = ()
    search_spec: SearchSpec | None = None
    ordering_fields: Mapping[str, str] = {}
    default_ordering: Sequence[str] = ("-created_at",)

    def filter_queryset(self, queryset: QuerySet[Any]) -> QuerySet[Any]:
        if getattr(self, "action", None) != "list":
            return queryset
        return apply_filters(
            queryset,
            query_params_dict(self.request),  # type: ignore[attr-defined]
            specs=self.filter_specs,
            search=self.search_spec,
            ordering_fields=self.ordering_fields,
            default_ordering=self.default_ordering,
        )
