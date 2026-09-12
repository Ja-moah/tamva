# ADR-002: PostgreSQL as transactional system of record

**Status:** Accepted

## Context
Financial state requires durable transactions, constraints, precise numeric values, and mature operations.

## Decision
Use one shared PostgreSQL deployment as the authoritative transactional store. Use UUID identifiers, timezone-aware timestamps, numeric money, constraints, and indexes.

## Consequences
Cross-domain atomicity is available during the monolith phase. Schema migrations and tenant predicates require disciplined review.

## Alternatives considered
Document stores, per-tenant databases, and multiple domain databases add complexity without current need.

