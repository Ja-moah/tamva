# Transactional outbox

Domain state and `OutboxEvent` are written in the same `transaction.atomic()` block. A worker later locks unpublished rows with `select_for_update(skip_locked=True)`, publishes them, and records `published_at`. Delivery is at least once: consumers must use `event_id` for idempotency.

The contract carries `event_id`, `event_type`, `event_version`, `occurred_at`, `producer`, `tenant_id`, `correlation_id`, and `payload`. Publishers retry transient failures and record attempts. A bounded retry policy will move exhausted messages to a dead-letter workflow. Events remain queryable for controlled replay, and incompatible payload changes require a new event version. Kafka is intentionally absent.

