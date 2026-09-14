import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

from packages.common.models import TimeStampedModel, UUIDModel


class User(AbstractUser):
    class IdentityType(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        PARTNER_USER = "PARTNER_USER", "Partner user"
        PLATFORM_USER = "PLATFORM_USER", "Platform user"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identity_type = models.CharField(max_length=20, choices=IdentityType, db_index=True)
    email = models.EmailField(unique=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("ACTIVE", "Active"),
            ("SUSPENDED", "Suspended"),
            ("PENDING", "Pending"),
            ("DEACTIVATED", "Deactivated"),
        ],
        default="ACTIVE",
        db_index=True,
    )
    updated_at = models.DateTimeField(auto_now=True)

    REQUIRED_FIELDS = ["email", "identity_type"]


class ServiceAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    institution = models.ForeignKey(
        "partner.Institution",
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="service_accounts",
    )
    status = models.CharField(
        max_length=20,
        choices=[("ACTIVE", "Active"), ("REVOKED", "Revoked")],
        default="ACTIVE",
        db_index=True,
    )
    scopes = models.JSONField(default=list, blank=True)
    credential_metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name

    @property
    def is_active(self) -> bool:
        return self.status == "ACTIVE"


class Permission(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return self.code


class Role(UUIDModel, TimeStampedModel):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=150)
    scope_type = models.CharField(max_length=30, default="INSTITUTION")
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name="roles", blank=True)

    def __str__(self) -> str:
        return self.code
