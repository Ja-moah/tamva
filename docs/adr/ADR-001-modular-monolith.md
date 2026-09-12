# ADR-001: Modular monolith for MVP

**Status:** Accepted

## Context
TAMVA needs strong domain ownership while a small team is still discovering boundaries. Distributed deployment would add failure modes and coordination cost.

## Decision
Deploy one Django application and separate domains as owned Django apps with narrow public interfaces.

## Consequences
Transactions, development, and operations remain simple. Owners must prevent implementation-level coupling; modules may be extracted later using observed scaling or ownership needs.

## Alternatives considered
Independent microservices were rejected as premature. An unstructured monolith was rejected because it obscures ownership.

