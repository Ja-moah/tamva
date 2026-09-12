from typing import Any, Protocol


class ProviderConnector(Protocol):
    provider: str

    def fetch(self, cursor: str | None = None) -> tuple[list[dict[str, Any]], str | None]: ...
