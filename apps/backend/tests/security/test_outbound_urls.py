import pytest

from packages.common.outbound import is_public_ip, outbound_url_problem


@pytest.mark.security
@pytest.mark.parametrize(
    "url",
    [
        "https://127.0.0.1/hook",
        "https://[::1]/hook",
        "https://10.0.0.5/hook",
        "https://172.16.4.4/hook",
        "https://192.168.1.10/hook",
        "https://169.254.169.254/latest/meta-data/",  # cloud metadata service
        "https://0.0.0.0/hook",
        "https://localhost/hook",
        "https://LOCALHOST./hook",
        "https://db.internal/hook",
        "https://printer.local/hook",
        "https://redis/hook",  # single-label docker/k8s service name
        "https://user:pass@partner.example.test/hook",
        "ftp://partner.example.test/hook",
        "file:///etc/passwd",
        "https:///nohost",
        "https://partner.example.test:notaport/hook",
    ],
)
def test_internal_and_malformed_targets_are_refused(url):
    assert outbound_url_problem(url, require_https=False)


@pytest.mark.security
def test_public_https_targets_are_accepted_and_http_only_where_allowed():
    assert outbound_url_problem("https://partner.example.test/events", require_https=True) is None
    assert outbound_url_problem("https://93.184.216.34/events", require_https=True) is None
    assert outbound_url_problem("http://partner.example.test/events", require_https=False) is None
    assert outbound_url_problem("http://partner.example.test/events", require_https=True)


@pytest.mark.security
def test_is_public_ip_rejects_reserved_ranges():
    assert is_public_ip("93.184.216.34")
    assert not any(
        is_public_ip(ip)
        for ip in ("127.0.0.1", "10.1.1.1", "169.254.1.1", "::1", "fc00::1", "nope")
    )
