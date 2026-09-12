from typing import Protocol


class NotificationSender(Protocol):
    def send(self, *, recipient: str, template: str, context: dict[str, str]) -> str: ...
