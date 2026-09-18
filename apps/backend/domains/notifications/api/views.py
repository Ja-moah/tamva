from __future__ import annotations

from typing import Any

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from domains.notifications.api.serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
    SetNotificationPreferenceSerializer,
)
from domains.notifications.models import Notification, NotificationPreference
from domains.notifications.services import mark_notification_read


class NotificationViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Customer-facing: a recipient only ever sees their own notifications."""

    serializer_class = NotificationSerializer
    queryset = Notification.objects.none()  # schema-introspection fallback only; see get_queryset

    def get_queryset(self) -> Any:
        return Notification.objects.filter(recipient=self.request.user).order_by("-created_at")

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
