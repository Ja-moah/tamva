# ADR-006: API versioning and error contract

**Status:** Accepted

## Context
Integrators need stable routes, machine-readable errors, and operational correlation.

## Decision
Place public APIs under `/api/v1/`, publish OpenAPI through drf-spectacular, and wrap handled errors with code, message, request ID, and details.

## Consequences
Breaking changes require a version strategy. Error payloads are consistent and traceable without exposing internals.

## Alternatives considered
Unversioned endpoints and framework-native error shapes were rejected as unstable contracts.

