from drf_spectacular.extensions import OpenApiAuthenticationExtension


class BearerTokenScheme(OpenApiAuthenticationExtension):
    target_class = "packages.auth.bearer.BearerTokenAuthentication"
    name = "bearerAuth"

    def get_security_definition(self, auto_schema: object) -> dict[str, str]:
        return {
            "type": "http",
            "scheme": "bearer",
            "description": (
                "Short-lived access token from POST /api/v1/auth/token/. Rotate it with "
                "POST /api/v1/auth/token/refresh/."
            ),
        }
