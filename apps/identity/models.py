import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class IdentityType(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        PARTNER_USER = "PARTNER_USER", "Partner user"
        PLATFORM_USER = "PLATFORM_USER", "Platform user"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identity_type = models.CharField(max_length=20, choices=IdentityType, db_index=True)
    email = models.EmailField(unique=True)

    REQUIRED_FIELDS = ["email", "identity_type"]


class ServiceAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name
