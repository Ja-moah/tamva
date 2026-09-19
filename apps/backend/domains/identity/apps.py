from django.apps import AppConfig


class IdentityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "domains.identity"

    def ready(self) -> None:
        # Registers the OpenAPI description of bearer authentication.
        from packages.auth import openapi  # noqa: F401
