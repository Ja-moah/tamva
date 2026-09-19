from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Case as SqlCase
from django.db.models import IntegerField, Value, When
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from domains.case.api.serializers import (
    AddCaseNoteSerializer,
    AssignCaseSerializer,
    BulkAssignCasesSerializer,
    BulkTriageCasesSerializer,
    CaseDetailSerializer,
    CaseSerializer,
    ManualCaseCreateSerializer,
    RecordCaseActionSerializer,
    ResolveCaseSerializer,
    TransitionCaseSerializer,
)
from domains.case.models import Case
from domains.case.services import (
    add_case_note,
    assign_case,
    bulk_assign_cases,
    bulk_triage_cases,
    open_case_manually,
    record_case_action,
    resolve_case,
    transition_case_status,
)
from domains.identity.api.permissions import HasPermission
from domains.identity.models import User
from domains.operations.idempotency import run_idempotent
from domains.partner.models import Institution
from packages.common.api import require_institution_id
from packages.common.filtering import (
    FilteredListMixin,
    FilterSpec,
    SearchSpec,
    filter_parameters,
)

FILTERS = (
    FilterSpec("status", "status", "choice", choices=tuple(Case.Status.values)),
    FilterSpec("priority", "priority", "choice", choices=tuple(Case.Priority.values)),
    FilterSpec("assignee", "current_assignee_id", "uuid"),
    FilterSpec(
        "unassigned", "current_assignee", "bool", "isnull", description="true = no assignee."
    ),
    FilterSpec("customer", "customer_id", "uuid"),
    FilterSpec("customer_id", "customer_id", "uuid", description="Alias of `customer`."),
    FilterSpec("case_type", "case_type"),
    FilterSpec("source", "source", "choice", choices=tuple(Case.Source.values)),
    FilterSpec("opened_from", "opened_at", "datetime", "gte"),
    FilterSpec("opened_to", "opened_at", "datetime", "lte"),
)
SEARCH = SearchSpec(("reference", "case_type"))
ORDERING = {
    "opened_at": "opened_at",
    "closed_at": "closed_at",
    "status": "status",
    "priority": "priority_rank",
    "reference": "reference",
}
PRIORITY_RANK = SqlCase(
    When(priority=Case.Priority.LOW, then=Value(1)),
    When(priority=Case.Priority.MEDIUM, then=Value(2)),
    When(priority=Case.Priority.HIGH, then=Value(3)),
    When(priority=Case.Priority.CRITICAL, then=Value(4)),
    default=Value(0),
    output_field=IntegerField(),
)


def _bulk_payload(results: list[dict[str, Any]]) -> dict[str, Any]:
    succeeded = sum(1 for r in results if r["outcome"] == "SUCCESS")
    return {
        "summary": {
            "requested": len(results),
            "succeeded": succeeded,
            "failed": len(results) - succeeded,
        },
        "results": results,
    }


def _reraise_as_api_error(exc: DjangoValidationError) -> DRFValidationError:
    return DRFValidationError(exc.message_dict if hasattr(exc, "message_dict") else str(exc))


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(FILTERS, search=SEARCH, ordering_fields=ORDERING)
    )
)
class CaseViewSet(
    FilteredListMixin, viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin
):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "case:read"
    throttle_scope: str | None = None  # bulk actions opt in via @action(throttle_scope=...)
    queryset = Case.objects.none()  # schema-introspection fallback only; see get_queryset
    filter_specs = FILTERS
    search_spec = SEARCH
    ordering_fields = ORDERING
    default_ordering = ("-opened_at", "id")

    def get_serializer_class(self) -> type[CaseSerializer]:
        if self.action == "retrieve":
            return CaseDetailSerializer
        return CaseSerializer

    def get_queryset(self) -> Any:
        institution_id = require_institution_id(self.request)
        queryset = (
            Case.objects.filter(institution_id=institution_id)
            .select_related("resolution")
            .prefetch_related("status_events", "assignments", "notes", "actions")
            .annotate(priority_rank=PRIORITY_RANK)
        )
        return queryset

    def get_permissions(self) -> list[Any]:
        if self.action in {
            "create",
            "assign",
            "transition",
            "add_note",
            "record_action",
            "resolve",
            "bulk_assign",
            "bulk_triage",
        }:
            self.required_permission = "case:manage"
        else:
            self.required_permission = "case:read"
        return super().get_permissions()

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        institution_id = require_institution_id(request)
        institution = Institution.objects.get(id=institution_id)
        serializer = ManualCaseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        customer = User.objects.get(id=data["customer_id"])
        case = open_case_manually(
            institution=institution,
            customer=customer,
            case_type=data["case_type"],
            priority=data["priority"],
            created_by=request.user,
        )
        return Response({"data": CaseSerializer(case).data}, status=status.HTTP_201_CREATED)

    @extend_schema(
        request=BulkAssignCasesSerializer,
        responses=None,
        description=(
            "Assign up to 100 cases. Each case is applied independently and reported in "
            "`data.results`. Send `Idempotency-Key` to make retries safe."
        ),
    )
    @action(detail=False, methods=["post"], url_path="bulk-assign", throttle_scope="bulk")
    def bulk_assign(self, request: Request) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        serializer = BulkAssignCasesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        assignee = (
            User.objects.filter(id=data["assignee_id"]).first() if data["assignee_id"] else None
        )
        if data["assignee_id"] and assignee is None:
            raise DRFValidationError({"assignee_id": ["Unknown user."]})

        def handler() -> dict[str, Any]:
            results = bulk_assign_cases(
                institution=institution,
                actor=request.user,
                case_ids=data["case_ids"],
                assignee=assignee,
                note=data["note"],
            )
            return {"data": _bulk_payload(results)}

        return run_idempotent(
            request,
            endpoint="cases.bulk-assign",
            institution=institution,
            body=request.data,
            handler=handler,
        )

    @extend_schema(
        request=BulkTriageCasesSerializer,
        responses=None,
        description="Move up to 100 OPEN cases to TRIAGED; other transitions are not bulk.",
    )
    @action(detail=False, methods=["post"], url_path="bulk-triage", throttle_scope="bulk")
    def bulk_triage(self, request: Request) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        serializer = BulkTriageCasesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        def handler() -> dict[str, Any]:
            results = bulk_triage_cases(
                institution=institution,
                actor=request.user,
                case_ids=data["case_ids"],
                note=data["note"],
            )
            return {"data": _bulk_payload(results)}

        return run_idempotent(
            request,
            endpoint="cases.bulk-triage",
            institution=institution,
            body=request.data,
            handler=handler,
        )

    @action(detail=True, methods=["post"], url_path="assign")
    def assign(self, request: Request, pk: str | None = None) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        case = self.get_object()
        serializer = AssignCaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        assignee = User.objects.get(id=data["assignee_id"]) if data.get("assignee_id") else None
        updated = assign_case(
            case=case,
            assignee=assignee,
            assigned_by=request.user,
            institution=institution,
            note=data.get("note", ""),
        )
        return Response({"data": CaseDetailSerializer(updated).data})

    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request: Request, pk: str | None = None) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        case = self.get_object()
        serializer = TransitionCaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            updated = transition_case_status(
                case=case,
                new_status=data["new_status"],
                institution=institution,
                actor=request.user,
                note=data.get("note", ""),
            )
        except DjangoValidationError as exc:
            raise _reraise_as_api_error(exc) from exc
        return Response({"data": CaseDetailSerializer(updated).data})

    @action(detail=True, methods=["post"], url_path="notes")
    def add_note(self, request: Request, pk: str | None = None) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        case = self.get_object()
        serializer = AddCaseNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = add_case_note(
            case=case,
            author=request.user,
            body=serializer.validated_data["body"],
            institution=institution,
        )
        return Response(
            {"data": {"id": str(note.id), "body": note.body, "created_at": note.created_at}},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="actions")
    def record_action(self, request: Request, pk: str | None = None) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        case = self.get_object()
        serializer = RecordCaseActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        record_case_action(
            case=case,
            actor=request.user,
            action_type=data["action_type"],
            institution=institution,
            detail=data.get("detail") or {},
        )
        return Response({"data": CaseDetailSerializer(case).data}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="resolve")
    def resolve(self, request: Request, pk: str | None = None) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        case = self.get_object()
        serializer = ResolveCaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            resolve_case(
                case=case,
                outcome=data["outcome"],
                reason=data["reason"],
                resolved_by=request.user,
                institution=institution,
            )
        except DjangoValidationError as exc:
            raise _reraise_as_api_error(exc) from exc
        case.refresh_from_db()
        return Response({"data": CaseDetailSerializer(case).data})
