from __future__ import annotations

import re
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone

from packages.common.models import TimeStampedModel, UUIDModel
from packages.common.outbound import outbound_url_problem


class Institution(UUIDModel, TimeStampedModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name


class InstitutionMembership(UUIDModel, TimeStampedModel):
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="institution_memberships"
    )
    status = models.CharField(
        max_length=20,
        choices=[("ACTIVE", "Active"), ("SUSPENDED", "Suspended"), ("ENDED", "Ended")],
        default="ACTIVE",
        db_index=True,
    )
    role = models.CharField(max_length=100, blank=True)
    roles = models.ManyToManyField("identity.Role", related_name="memberships", blank=True)

    @property
    def is_active(self) -> bool:
        return self.status == "ACTIVE"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "user"], name="unique_institution_member"
            )
        ]
        indexes = [models.Index(fields=["institution", "status"])]


class PartnerApplication(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        SUSPENDED = "SUSPENDED", "Suspended"
        REVOKED = "REVOKED", "Revoked"

    institution = models.ForeignKey(
        Institution, on_delete=models.PROTECT, related_name="partner_applications"
    )
    service_account = models.OneToOneField(
        "identity.ServiceAccount",
        on_delete=models.PROTECT,
        related_name="partner_application",
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status, default=Status.ACTIVE, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["institution", "slug"], name="unique_partner_application_slug_per_tenant"
            )
        ]
        indexes = [models.Index(fields=["institution", "status"])]

    def clean(self) -> None:
        if self.service_account_id and self.service_account.institution_id != self.institution_id:
            raise ValidationError(
                {"service_account": "Service account must belong to the same institution."}
            )

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.institution_id}:{self.slug}"


class PartnerEnvironment(UUIDModel, TimeStampedModel):
    class Kind(models.TextChoices):
        SANDBOX = "SANDBOX", "Sandbox"
        STAGING = "STAGING", "Staging"
        PRODUCTION = "PRODUCTION", "Production"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        DISABLED = "DISABLED", "Disabled"

    application = models.ForeignKey(
        PartnerApplication, on_delete=models.PROTECT, related_name="environments"
    )
    kind = models.CharField(max_length=20, choices=Kind)
    status = models.CharField(max_length=20, choices=Status, default=Status.ACTIVE, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["application", "kind"], name="unique_partner_application_environment"
            )
        ]
        indexes = [models.Index(fields=["application", "status"])]

    def __str__(self) -> str:
        return f"{self.application_id}:{self.kind}"


class CredentialScope(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.code


class ApiCredential(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        REVOKED = "REVOKED", "Revoked"

    environment = models.ForeignKey(
        PartnerEnvironment, on_delete=models.PROTECT, related_name="api_credentials"
    )
    name = models.CharField(max_length=150)
    client_id = models.CharField(max_length=100, unique=True, editable=False)
    secret_digest = models.CharField(max_length=64, editable=False)
    scopes = models.ManyToManyField(CredentialScope, related_name="api_credentials")
    status = models.CharField(max_length=20, choices=Status, default=Status.ACTIVE, db_index=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    revoked_at = models.DateTimeField(blank=True, null=True)
    last_used_at = models.DateTimeField(blank=True, null=True)
    rotated_from = models.OneToOneField(
        "self",
        blank=True,
        null=True,
        on_delete=models.PROTECT,
        related_name="rotated_to",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="created_api_credentials",
    )

    class Meta:
        indexes = [models.Index(fields=["environment", "status"])]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(status="REVOKED", revoked_at__isnull=False)
                    | (Q(status="ACTIVE") & Q(revoked_at__isnull=True))
                ),
                name="api_credential_revocation_matches_status",
            )
        ]

    def clean(self) -> None:
        errors: dict[str, str] = {}
        rotated_from = self.rotated_from if self.rotated_from_id else None
        if rotated_from is not None and rotated_from.environment_id != self.environment_id:
            errors["rotated_from"] = "Credential rotation cannot cross environments."
        if self._state.adding and self.expires_at and self.expires_at <= timezone.now():
            errors["expires_at"] = "Credential expiry must be in the future when issued."
        if not self._state.adding and self.pk:
            original = (
                type(self).objects.filter(pk=self.pk).values("client_id", "secret_digest").first()
            )
            if original and original["client_id"] != self.client_id:
                errors["client_id"] = "Credential client IDs are immutable."
            if original and original["secret_digest"] != self.secret_digest:
                errors["secret_digest"] = "Credential secrets cannot be replaced in place."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.client_id


class WebhookEndpoint(UUIDModel, TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        DISABLED = "DISABLED", "Disabled"

    environment = models.ForeignKey(
        PartnerEnvironment, on_delete=models.PROTECT, related_name="webhook_endpoints"
    )
    url = models.URLField(max_length=500)
    event_types = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=Status, default=Status.ACTIVE, db_index=True)
    verified_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["environment", "url"], name="unique_webhook_url_per_environment"
            )
        ]
        indexes = [models.Index(fields=["environment", "status"])]

    def clean(self) -> None:
        if self.environment_id:
            problem = outbound_url_problem(
                self.url, require_https=self.environment.kind == PartnerEnvironment.Kind.PRODUCTION
            )
            if problem:
                raise ValidationError({"url": problem})
        if not self.event_types:
            raise ValidationError({"event_types": "At least one webhook event type is required."})

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.environment_id}:{self.url}"


class InstitutionLocaleSettings(UUIDModel, TimeStampedModel):
    """Country, currency, timezone and locale an institution operates in.

    These control presentation and defaults only. Financial records always keep
    their original amount and currency; nothing here converts them.
    """

    institution = models.OneToOneField(
        Institution, on_delete=models.CASCADE, related_name="locale_settings"
    )
    country_code = models.CharField(max_length=2, default="GH")
    default_currency = models.CharField(max_length=3, default="GHS")
    timezone = models.CharField(max_length=64, default="Africa/Accra")
    locale = models.CharField(max_length=20, default="en-GH")

    class Meta:
        verbose_name_plural = "institution locale settings"

    def clean(self) -> None:
        errors: dict[str, str] = {}
        if not (len(self.country_code) == 2 and self.country_code.isalpha()):
            errors["country_code"] = "Must be an ISO 3166-1 alpha-2 code."
        if not (len(self.default_currency) == 3 and self.default_currency.isalpha()):
            errors["default_currency"] = "Must be an ISO 4217 alpha-3 code."
        try:
            ZoneInfo(self.timezone)
        except (ZoneInfoNotFoundError, ValueError):
            errors["timezone"] = "Must be a valid IANA timezone name."
        if not re.fullmatch(r"[a-z]{2,3}(-[A-Za-z0-9]{2,8})*", self.locale):
            errors["locale"] = "Must be a BCP 47 language tag such as en-GH."
        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.country_code = self.country_code.upper()
        self.default_currency = self.default_currency.upper()
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.institution_id}:{self.country_code}/{self.default_currency}"
