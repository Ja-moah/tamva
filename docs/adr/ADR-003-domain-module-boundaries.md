# ADR-003: Domain module boundaries

**Status:** Accepted

## Context
Five developers need to work concurrently without accidental shared ownership.

## Decision
Each domain owns its code, models, migrations, tests, and README. Cross-domain access uses explicit interfaces or contracts; arbitrary implementation imports and direct foreign-table queries are prohibited.

## Consequences
Changes remain reviewable and extraction remains possible. Some duplication is preferable to a misleading shared abstraction.

## Alternatives considered
A layer-only layout and unrestricted imports were rejected because they disperse domain responsibility.

