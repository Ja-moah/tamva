from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from domains.case.api.serializers import (
    AddCaseNoteSerializer,
    AssignCaseSerializer,
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
    open_case_manually,
    record_case_action,
    resolve_case,
    transition_case_status,
)
from domains.identity.api.permissions import HasPermission
from domains.identity.models import User
from domains.partner.models import Institution
from packages.common.api import require_institution_id


def _reraise_as_api_error(exc: DjangoValidationError) -> DRFValidationError:
    return DRFValidationError(exc.message_dict if hasattr(exc, "message_dict") else str(exc))


class CaseViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "case:read"
    queryset = Case.objects.none()  # schema-introspection fallback only; see get_queryset

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
            .order_by("-opened_at")
        )
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        customer_id = self.request.query_params.get("customer_id")
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset

    def get_permissions(self) -> list[Any]:
        if self.action in {
            "create",
            "assign",
            "transition",
            "add_note",
            "record_action",
            "resolve",
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
