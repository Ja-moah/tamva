from __future__ import annotations

from typing import Any

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from domains.consent.api.serializers import ConsentSerializer, GrantConsentSerializer
from domains.consent.models import Consent
from domains.consent.services import grant_consent, revoke_consent


class ConsentViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Customer-facing consent management: a customer only ever sees, grants,
    and revokes their own consent records. Institution staff manage the
    purposes/scopes they publish, not this endpoint.
    """

    serializer_class = ConsentSerializer
    queryset = Consent.objects.none()  # schema-introspection fallback only; see get_queryset

    def get_queryset(self) -> Any:
        return (
            Consent.objects.filter(customer=self.request.user)
            .select_related("purpose", "institution")
            .prefetch_related("scopes")
            .order_by("-granted_at")
        )

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = GrantConsentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        consent = grant_consent(
            customer=request.user,
            institution=data["institution"],
            purpose=data["purpose"],
            scopes=data["scopes"],
            actor=request.user,
            expires_at=data["expires_at"],
        )
        return Response({"data": ConsentSerializer(consent).data}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def revoke(self, request: Request, pk: str | None = None) -> Response:
        consent = self.get_object()
        revoked = revoke_consent(
            consent_id=consent.id, institution=consent.institution, actor=request.user
        )
        return Response({"data": ConsentSerializer(revoked).data})
