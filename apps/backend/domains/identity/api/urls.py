from django.urls import path

from domains.identity.api.views import (
    CsrfView,
    CustomerRegistrationView,
    LoginView,
    LogoutView,
    MeView,
    RecoveryConfirmView,
    RecoveryRequestView,
    RefreshView,
    TokenRefreshView,
    TokenRevokeAllView,
    TokenRevokeView,
    TokenView,
)

urlpatterns = [
    path("auth/csrf/", CsrfView.as_view(), name="auth-csrf"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/token/", TokenView.as_view(), name="auth-token"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("auth/token/revoke/", TokenRevokeView.as_view(), name="auth-token-revoke"),
    path("auth/token/revoke-all/", TokenRevokeAllView.as_view(), name="auth-token-revoke-all"),
    path("auth/recovery/request/", RecoveryRequestView.as_view(), name="auth-recovery-request"),
    path("auth/recovery/confirm/", RecoveryConfirmView.as_view(), name="auth-recovery-confirm"),
    path("customer/register/", CustomerRegistrationView.as_view(), name="customer-register"),
    path("me/", MeView.as_view(), name="me"),
]
