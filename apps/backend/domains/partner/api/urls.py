from django.urls import path
from rest_framework.routers import DefaultRouter

from domains.partner.api.views import (
    ConnectionViewSet,
    CreateWebhookView,
    InstitutionLocaleView,
    IssueCredentialView,
    PartnerApplicationViewSet,
    RevokeCredentialView,
    RotateCredentialView,
    ScopeListView,
    TeamMemberViewSet,
    TeamPermissionListView,
    TeamRoleListView,
)

router = DefaultRouter()
router.register("team/members", TeamMemberViewSet, basename="team-member")
router.register(
    "integrations/applications", PartnerApplicationViewSet, basename="integration-application"
)
router.register("integrations/connections", ConnectionViewSet, basename="integration-connection")

urlpatterns = [
    path("institution/locale/", InstitutionLocaleView.as_view(), name="institution-locale"),
    path("team/roles/", TeamRoleListView.as_view(), name="team-roles"),
    path("team/permissions/", TeamPermissionListView.as_view(), name="team-permissions"),
    path("integrations/scopes/", ScopeListView.as_view(), name="integration-scopes"),
    path(
        "integrations/environments/<uuid:environment_id>/credentials/",
        IssueCredentialView.as_view(),
        name="integration-credential-issue",
    ),
    path(
        "integrations/environments/<uuid:environment_id>/webhooks/",
        CreateWebhookView.as_view(),
        name="integration-webhook-create",
    ),
    path(
        "integrations/credentials/<uuid:credential_id>/rotate/",
        RotateCredentialView.as_view(),
        name="integration-credential-rotate",
    ),
    path(
        "integrations/credentials/<uuid:credential_id>/revoke/",
        RevokeCredentialView.as_view(),
        name="integration-credential-revoke",
    ),
    *router.urls,
]
