from typing import Any

from django.core.management.base import BaseCommand

from domains.identity.catalog import sync_access_catalog


class Command(BaseCommand):
    help = "Create or update the canonical permissions and default roles."

    def handle(self, *args: Any, **options: Any) -> None:
        counts = sync_access_catalog()
        self.stdout.write(
            f"Synced {counts['permissions']} permissions and {counts['roles']} roles."
        )
