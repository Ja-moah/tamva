from __future__ import annotations

from typing import Any

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from domains.notifications.api.serializers import (
    BulkReadSerializer,
    NotificationPreferenceSerializer,
    NotificationSerializer,
    SetNotificationPreferenceSerializer,
)
from domains.notifications.models import (
    Notification,
    NotificationChannel,
    NotificationPreference,
)
from domains.notifications.services import (
    bulk_mark_notifications_read,
    mark_notification_read,
)
from packages.common.filtering import FilteredListMixin, FilterSpec, filter_parameters

FILTERS = (
    FilterSpec("category", "template__category"),
    FilterSpec("state", "status", "choice", choices=tuple(Notification.Status.values)),
    FilterSpec("channel", "channel", "choice", choices=tuple(NotificationChannel.values)),
    FilterSpec("unread", "read_at", "bool", "isnull", description="true = not yet read."),
    FilterSpec("date_from", "created_at", "datetime", "gte"),
    FilterSpec("date_to", "created_at", "datetime", "lte"),
)
ORDERING = {"created_at": "created_at", "state": "status", "channel": "channel"}


@extend_schema_view(
    list=extend_schema(parameters=filter_parameters(FILTERS, ordering_fields=ORDERING))
)
class NotificationViewSet(
    FilteredListMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Customer-facing: a recipient only ever sees their own notifications."""

    serializer_class = NotificationSerializer
    queryset = Notification.objects.none()  # schema-introspection fallback only; see get_queryset
    filter_specs = FILTERS
    ordering_fields = ORDERING
    default_ordering = ("-created_at", "id")
    throttle_scope: str | None = None  # bulk-read opts in via @action(throttle_scope=...)

    def get_queryset(self) -> Any:
        return Notification.objects.filter(recipient=self.request.user).select_related("template")

    @extend_schema(request=BulkReadSerializer, responses=None)
    @action(detail=False, methods=["post"], url_path="bulk-read", throttle_scope="bulk")
    def bulk_read(self, request: Request) -> Response:
        serializer = BulkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        summary = bulk_mark_notifications_read(
            recipient=request.user,
            notification_ids=serializer.validated_data["notification_ids"],
        )
        return Response({"data": summary})

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request: Request, pk: str | None = None) -> Response:
        notification = self.get_object()
        updated = mark_notification_read(notification=notification, recipient=request.user)
        return Response({"data": NotificationSerializer(updated).data})


class NotificationPreferenceViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Customer-facing preference management. Creating a preference for an
    existing (customer, category, channel) triple updates it in place.
    """

    serializer_class = NotificationPreferenceSerializer

    def get_queryset(self) -> Any:
        return NotificationPreference.objects.filter(customer=self.request.user).order_by(
            "category"
        )

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = SetNotificationPreferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        preference, _ = NotificationPreference.objects.update_or_create(
            customer=request.user,
            category=data["category"],
            channel=data["channel"],
            defaults={"enabled": data["enabled"]},
        )
        return Response(
            {"data": NotificationPreferenceSerializer(preference).data},
            status=status.HTTP_200_OK,
        )
