# Notifications

Owns delivery abstractions and provider routing for notifications. Business
domains request notifications through contracts (the transactional outbox);
they do not import provider implementations.

## Pipeline

```
domain event (Case, ...)
     |
packages.events.OutboxEvent
     |
NotificationEventBinding -> NotificationTemplate
     |
Notification (idempotent per event+template+channel+recipient)
     |
NotificationProvider.send()  ->  NotificationDeliveryAttempt
```

`services.process_outbox_event(event=...)` is the entry point: it resolves a
trusted recipient from the event payload, applies notification preferences
(unless the template is `mandatory`), renders the template, and attempts
delivery. This is currently invoked synchronously; no new Celery/outbox
polling infrastructure was introduced, since none existed to integrate with.

## Provider boundary

`providers.NotificationProvider` is a typed interface; business/domain code
never imports a real email/SMS/push vendor SDK. The only providers shipped
are reference/test-safe: `InAppNotificationProvider` (delivery is simply
persisting the record) and `DeterministicMockEmailProvider` (never calls a
real email vendor).

## Templates

`NotificationTemplate.subject_template` / `body_template` use
`string.Template` `$placeholder` substitution only — no `eval()`, no
attribute/index access, no arbitrary code execution.

## Out of scope here

Mobile push UI, an admin notification center, the trust graph, the financial
passport, and live production SMS/email credentials are not implemented in
this domain.
