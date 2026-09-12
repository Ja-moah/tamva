# ADR-007: Event delivery and transactional outbox

**Status:** Accepted

## Context
Asynchronous workflows must not lose events between database commits and broker publication.

## Decision
Persist versioned events in an outbox within the domain transaction, then publish asynchronously through Celery/Redis. Delivery is at least once; consumers are idempotent and replayable.

## Consequences
Publishing needs locking, retries, attempt tracking, and a dead-letter procedure. Consumers must deduplicate by event ID.

## Alternatives considered
Direct broker publish risks dual-write loss. Kafka is premature. In-process signals are insufficient for durable delivery.

