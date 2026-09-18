import pytest
from rest_framework.response import Response
from rest_framework.views import APIView


@pytest.mark.security
def test_default_api_permission_requires_authentication(rf) -> None:
    class ProtectedView(APIView):
        def get(self, request) -> Response:
            return Response({"ok": True})

    response = ProtectedView.as_view()(rf.get("/api/v1/protected/"))
    assert response.status_code in {401, 403}
