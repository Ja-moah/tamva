"""Validation of URLs the platform will call on a customer's behalf (webhooks).

Registration-time checks only: scheme, credentials, and hosts that are obviously
internal (loopback, private/link-local/reserved IP literals, `localhost`, internal
suffixes). A hostname can still *resolve* to an internal address, so any code that
actually delivers must re-validate the resolved IP at connect time (DNS rebinding);
`is_public_ip` is provided for that.
"""

from __future__ import annotations

import ipaddress
from urllib.parse import urlparse

INTERNAL_SUFFIXES = (".local", ".localhost", ".internal", ".lan", ".home", ".corp", ".intranet")


def is_public_ip(value: str) -> bool:
    try:
        ip = ipaddress.ip_address(value)
    except ValueError:
        return False
    return ip.is_global and not ip.is_multicast


def outbound_url_problem(url: str, *, require_https: bool) -> str | None:
    """Return a client-safe reason the URL is not allowed, or None."""
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").rstrip(".").lower()
        parsed.port  # noqa: B018  (raises ValueError for a malformed port)
    except ValueError:
        return "Enter a valid URL."
    if parsed.scheme not in {"http", "https"} or not host:
        return "Enter a valid http(s) URL."
    if require_https and parsed.scheme != "https":
        return "Webhook endpoints must use HTTPS."
    if parsed.username or parsed.password:
        return "URLs must not contain credentials."
    try:
        ipaddress.ip_address(host)
    except ValueError:
        if host == "localhost" or host.endswith(INTERNAL_SUFFIXES) or "." not in host:
            return "Webhook endpoints must be publicly reachable hosts."
    else:
        if not is_public_ip(host):
            return "Webhook endpoints must be publicly reachable hosts."
    return None
