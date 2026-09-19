import os
from getpass import getpass
from typing import Any

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.db import transaction

from domains.audit.services import record_audit
from domains.identity.catalog import sync_access_catalog
from domains.identity.models import Role, User
from domains.partner.models import Institution, InstitutionMembership


class Command(BaseCommand):
    help = (
        "Create an institution and its first administrator (idempotent). The password is "
        "read from BOOTSTRAP_ADMIN_PASSWORD or prompted for; it is never a command-line "
        "argument and is never printed."
    )

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--name", required=True)
        parser.add_argument("--slug", required=True)
        parser.add_argument("--admin-email", required=True)

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        email = options["admin_email"].strip().lower()
        sync_access_catalog()
        institution, created = Institution.objects.get_or_create(
            slug=options["slug"], defaults={"name": options["name"]}
        )
        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD") or getpass(
                "Administrator password: "
            )
            try:
                validate_password(password)
            except ValidationError as exc:
                raise CommandError("Password rejected: " + " ".join(exc.messages)) from None
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                identity_type=User.IdentityType.PLATFORM_USER,
            )
        elif user.identity_type != User.IdentityType.PLATFORM_USER:
            raise CommandError("That email belongs to a non-institutional account.")
        membership, _ = InstitutionMembership.objects.get_or_create(
            institution=institution, user=user, defaults={"status": "ACTIVE"}
        )
        membership.roles.add(Role.objects.get(code="INSTITUTION_ADMIN"))
        record_audit(
            action="INSTITUTION_BOOTSTRAPPED",
            actor=user,
            institution=institution,
            metadata={"institution_created": created},
        )
        self.stdout.write(f"Institution {institution.slug} ready; administrator {email}.")
