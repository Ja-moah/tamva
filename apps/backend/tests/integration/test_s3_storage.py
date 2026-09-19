"""Private object storage against a real S3-compatible service (MinIO in development).

Skipped unless TAMVA_TEST_S3_ENDPOINT is set, e.g.:
  docker compose --profile storage up -d minio minio-init
  TAMVA_TEST_S3_ENDPOINT=http://minio:9000 pytest tests/integration/test_s3_storage.py
"""

import os
import urllib.error
import urllib.request

import pytest
from django.core.files.base import ContentFile
from django.core.files.storage import storages
from django.test import override_settings

ENDPOINT = os.getenv("TAMVA_TEST_S3_ENDPOINT")
pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(not ENDPOINT, reason="no S3-compatible endpoint configured"),
]


@pytest.fixture
def s3():
    options = {
        "bucket_name": os.getenv("TAMVA_TEST_S3_BUCKET", "tamva-private"),
        "endpoint_url": ENDPOINT,
        "access_key": os.getenv("TAMVA_TEST_S3_KEY", "tamva-dev"),
        "secret_key": os.getenv("TAMVA_TEST_S3_SECRET", "tamva-dev-secret"),
        "addressing_style": "path",
        "default_acl": None,
        "querystring_auth": True,
        "querystring_expire": 60,
        "file_overwrite": False,
        "signature_version": "s3v4",
    }
    with override_settings(
        STORAGES={
            "default": {"BACKEND": "storages.backends.s3.S3Storage", "OPTIONS": options},
            "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
        }
    ):
        storages._storages.clear()  # rebuild with the overridden settings
        yield storages["default"]
    storages._storages.clear()


def test_objects_are_private_signed_and_never_overwritten(s3):
    name = s3.save("exports/inst-1/job-1.csv", ContentFile(b"a,b\n1,2\n"))

    assert name == "exports/inst-1/job-1.csv"
    assert s3.open(name).read() == b"a,b\n1,2\n"
    signed = s3.url(name)
    assert "X-Amz-Signature" in signed and "X-Amz-Expires=60" in signed
    assert urllib.request.urlopen(signed, timeout=5).read() == b"a,b\n1,2\n"

    unsigned = signed.split("?")[0]
    with pytest.raises(urllib.error.HTTPError) as denied:
        urllib.request.urlopen(unsigned, timeout=5)
    assert denied.value.code in {401, 403}

    second = s3.save("exports/inst-1/job-1.csv", ContentFile(b"other"))
    assert second != name  # file_overwrite=False keeps the first artifact intact

    s3.delete(name)
    s3.delete(second)
    assert not s3.exists(name)
