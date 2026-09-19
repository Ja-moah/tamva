from rest_framework.request import Request
from rest_framework.throttling import ScopedRateThrottle, SimpleRateThrottle
from rest_framework.views import APIView


class WriteThrottle(SimpleRateThrottle):
    """Per-user limit on state-changing requests only; reads are unaffected."""

    scope = "customer_write"

    def get_cache_key(self, request: Request, view: APIView) -> str | None:
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return None
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return None
        return self.cache_format % {"scope": self.scope, "ident": user.pk}


# Scoped throttles still apply; this adds the write limit for customer mutations.
CUSTOMER_THROTTLES = [ScopedRateThrottle, WriteThrottle]
