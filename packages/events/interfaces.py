from typing import Protocol

from packages.events.models import OutboxEvent


class EventPublisher(Protocol):
    def publish(self, event: OutboxEvent) -> None: ...


class EventHandler(Protocol):
    def handle(self, event: OutboxEvent) -> None: ...
