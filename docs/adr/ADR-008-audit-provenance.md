# ADR-008: Audit and data provenance principles

**Status:** Accepted

## Context
Trust decisions must be explainable without turning logs into a store of sensitive data.

## Decision
Maintain append-only audit records and provenance links for material actions, inputs, transformations, versions, actors, tenants, and correlation IDs. Protect integrity and minimize PII.

## Consequences
Mutation and erasure workflows need deliberate compliance design. Audit access is privileged and itself audited.

## Alternatives considered
Ordinary mutable logs lack integrity and retention semantics. Storing full payloads everywhere creates unacceptable exposure.

