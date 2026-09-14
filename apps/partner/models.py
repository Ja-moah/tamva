from django.conf import settings
from django.db import models

from packages.common.models import TimeStampedModel, UUIDModel


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
