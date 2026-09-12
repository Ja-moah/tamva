# ADR-004: Institution-based multi-tenancy

**Status:** Accepted

## Context
Partner institutions share TAMVA infrastructure while their resources require strict isolation.

## Decision
Represent institutions and memberships in shared PostgreSQL. Enforce tenant and resource authorization server-side for every tenant-scoped operation.

## Consequences
Operations and analytics stay manageable. Query paths and background jobs must always propagate trusted tenant context, backed by negative tests.

## Alternatives considered
Database-per-tenant was rejected for operational cost. Frontend filtering was rejected because it is not a security control.

