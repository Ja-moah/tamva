# Database conventions

Use UUID public identifiers, timezone-aware timestamps (`TIMESTAMPTZ` on PostgreSQL), `DecimalField`/`NUMERIC` for money, explicit foreign-key deletion behavior, constraints, and indexes based on query paths. Never store money as float. Use `transaction.atomic()` for multi-write invariants and `select_for_update()` for workflows that require row serialization. Migrations require review for locks, data volume, reversibility, and tenant isolation.

