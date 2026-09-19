from __future__ import annotations

from typing import Any

from django.conf import settings
from django.db import IntegrityError, transaction
from django.http import FileResponse
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from domains.audit.services import record_audit
from domains.identity.api.permissions import HasPermission
from domains.identity.models import User
from domains.identity.services import user_has_permission
from domains.operations import analytics, customers
from domains.operations.api.serializers import (
    ExportJobSerializer,
    ExportRequestSerializer,
    SavedViewSerializer,
)
from domains.operations.exports import (
    issue_download_token,
    request_export,
    verify_download_token,
)
from domains.operations.models import ExportJob, SavedView
from domains.operations.resources import RESOURCES, can_read
from domains.partner.models import Institution
from packages.common.api import require_institution_id
from packages.common.filtering import FilteredListMixin, filter_parameters

DAYS_PARAM = OpenApiParameter(
    "days", OpenApiTypes.INT, required=False, description="Window in days, 1-366 (default 30)."
)


def _days(request: Request) -> int:
    raw = request.query_params.get("days", "30")
    try:
        days = int(raw)
    except ValueError as exc:
        raise ValidationError({"days": ["Must be an integer."]}) from exc
    if not 1 <= days <= analytics.MAX_WINDOW_DAYS:
        raise ValidationError({"days": [f"Must be between 1 and {analytics.MAX_WINDOW_DAYS}."]})
    return days


class OverviewView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "overview:read"

    @extend_schema(parameters=[DAYS_PARAM], responses=None)
    def get(self, request: Request) -> Response:
        return Response(
            {"data": analytics.overview(require_institution_id(request), _days(request))}
        )


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "analytics:read"

    @extend_schema(parameters=[DAYS_PARAM], responses=None)
    def get(self, request: Request) -> Response:
        return Response(
            {"data": analytics.analytics(require_institution_id(request), _days(request))}
        )


# ------------------------------------------------------------- customers


class CustomerViewSet(
    FilteredListMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Consent-scoped customer summaries. No raw transactions or balances."""

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "customer:read"
    serializer_class = serializers.Serializer  # responses are built by customers.summarize
    queryset = User.objects.none()
    filter_specs = customers.FILTERS
    search_spec = customers.SEARCH
    ordering_fields = customers.ORDERING
    default_ordering = ("username", "id")

    def get_queryset(self) -> Any:
        institution_id = require_institution_id(self.request)
        return customers.customer_queryset(
            institution_id,
            include_passport=user_has_permission(
                self.request.user, "passport:read", institution_id
            ),
        )

    @extend_schema(
        parameters=filter_parameters(
            customers.FILTERS, search=customers.SEARCH, ordering_fields=customers.ORDERING
        ),
        operation_id="customers_list",
        responses=None,
    )
    def list(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        include_passport = user_has_permission(
            request.user, "passport:read", require_institution_id(request)
        )
        page = self.paginate_queryset(self.filter_queryset(self.get_queryset()))
        rows = [customers.summarize(u, include_passport=include_passport) for u in page or []]
        return self.get_paginated_response(rows)

    @extend_schema(operation_id="customers_retrieve", responses=None)
    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        from domains.case.models import Case
        from domains.risk.models import RiskEvent

        institution_id = require_institution_id(request)
        include_passport = user_has_permission(request.user, "passport:read", institution_id)
        user = self.get_object()
        data = customers.summarize(user, include_passport=include_passport)
        # Recent activity is reference data only (no amounts, no raw payloads).
        data["recent_cases"] = list(
            Case.objects.filter(institution_id=institution_id, customer_id=user.id)
            .order_by("-opened_at")
            .values("id", "reference", "case_type", "priority", "status", "opened_at")[:5]
        )
        data["recent_risk_events"] = list(
            RiskEvent.objects.filter(institution_id=institution_id, customer_id=user.id)
            .order_by("-evaluated_at")
            .values("id", "decision", "score", "evaluated_at")[:5]
        )
        return Response({"data": data})


# ----------------------------------------------------------- saved views


class SavedViewViewSet(viewsets.ModelViewSet):
    """Private to their owner within one institution."""

    permission_classes = [IsAuthenticated]
    serializer_class = SavedViewSerializer
    queryset = SavedView.objects.none()
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self) -> Any:
        queryset = SavedView.objects.filter(
            institution_id=require_institution_id(self.request), owner=self.request.user
        ).order_by("resource_type", "name")
        resource_type = self.request.query_params.get("resource_type")
        return queryset.filter(resource_type=resource_type) if resource_type else queryset

    def get_serializer_context(self) -> dict[str, Any]:
        context = super().get_serializer_context()
        if getattr(self, "swagger_fake_view", False):
            return context
        context["institution_id"] = require_institution_id(self.request)
        return context

    def perform_create(self, serializer: SavedViewSerializer) -> None:
        institution = Institution.objects.get(id=require_institution_id(self.request))
        try:
            with transaction.atomic():
                serializer.save(institution=institution, owner=self.request.user)
        except IntegrityError as exc:
            raise ValidationError(
                {"name": ["You already have a saved view with this name."]}
            ) from exc

    def perform_update(self, serializer: SavedViewSerializer) -> None:
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError as exc:
            raise ValidationError(
                {"name": ["You already have a saved view with this name."]}
            ) from exc


# --------------------------------------------------------------- catalog


class ResourceCatalogView(APIView):
    """What a client may filter, sort and export for each resource *for this
    actor*: drives filter bars, column pickers and saved-view forms."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=None)
    def get(self, request: Request) -> Response:
        institution_id = require_institution_id(request)
        catalog = []
        for resource in RESOURCES.values():
            if not can_read(resource, request.user, institution_id):
                continue
            catalog.append(
                {
                    "resource_type": resource.key,
                    "filters": [
                        {
                            "param": spec.param,
                            "kind": spec.kind,
                            "choices": list(spec.choices),
                            "description": spec.description,
                        }
                        for spec in resource.filters
                    ],
                    "search": list(resource.search.fields) if resource.search else [],
                    "ordering": sorted(resource.ordering),
                    "columns": [
                        {"key": c.key, "label": c.label}
                        for c in resource.allowed_columns(request.user, institution_id)
                    ],
                }
            )
        return Response({"data": catalog})


# --------------------------------------------------------------- exports


class ExportViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Export jobs are private to the actor who requested them."""

    permission_classes = [IsAuthenticated]
    serializer_class = ExportJobSerializer
    queryset = ExportJob.objects.none()
    throttle_scope = "export"

    def get_queryset(self) -> Any:
        return ExportJob.objects.filter(
            institution_id=require_institution_id(self.request), requested_by=self.request.user
        ).order_by("-created_at")

    @extend_schema(request=ExportRequestSerializer, responses={202: ExportJobSerializer})
    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        if not user_has_permission(request.user, "export:manage", institution.id):
            raise PermissionDenied("You do not have the required permission.")
        serializer = ExportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        job = request_export(
            institution=institution,
            actor=request.user,
            resource_key=data["resource_type"],
            file_format=data["format"],
            filters=data["filters"],
            ordering=data["ordering"],
            columns=data["columns"],
            selected_ids=data["selected_ids"],
        )
        job.refresh_from_db()  # eager workers (tests) may already have completed it
        return Response({"data": ExportJobSerializer(job).data}, status=status.HTTP_202_ACCEPTED)

    @extend_schema(request=None, responses=None)
    @action(detail=True, methods=["post"], url_path="download-link")
    def download_link(self, request: Request, pk: str | None = None) -> Response:
        job = self.get_object()
        self._require_downloadable(job, request)
        token = issue_download_token(job, request.user)
        return Response(
            {
                "data": {
                    "path": f"/api/v1/exports/{job.id}/download/",
                    "token": token,
                    "expires_in_seconds": settings.EXPORT_LINK_TTL_SECONDS,
                }
            }
        )

    @extend_schema(
        parameters=[OpenApiParameter("token", OpenApiTypes.STR, required=True)],
        responses={(200): OpenApiTypes.BINARY},
    )
    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request: Request, pk: str | None = None) -> FileResponse:
        job = self.get_object()
        self._require_downloadable(job, request)
        if not verify_download_token(request.query_params.get("token", ""), job, request.user):
            raise PermissionDenied("The download link is invalid or has expired.")
        record_audit(
            action="EXPORT_DOWNLOADED",
            actor=request.user,
            institution=job.institution,
            metadata={"export_id": str(job.id), "resource": job.resource_type},
        )
        extension = "xlsx" if job.format == ExportJob.Format.XLSX else "csv"
        response = FileResponse(
            job.artifact.open("rb"),
            as_attachment=True,
            filename=f"tamva-{job.resource_type.lower()}-{job.created_at:%Y%m%d}.{extension}",
        )
        response["Cache-Control"] = "no-store"
        return response

    def _require_downloadable(self, job: ExportJob, request: Request) -> None:
        if not user_has_permission(request.user, "export:manage", job.institution_id):
            raise PermissionDenied("You do not have the required permission.")
        if job.status != ExportJob.Status.COMPLETED or not job.artifact:
            raise ValidationError({"detail": f"Export is {job.status.lower()}."})
        if job.expires_at <= timezone.now():
            raise NotFound("This export has expired.")
