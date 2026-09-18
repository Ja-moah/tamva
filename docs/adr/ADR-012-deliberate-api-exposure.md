# ADR-012: API exposure is deliberate, not automatic

**Status:** Accepted

## Context
By the end of the core domain build-out, fourteen domains existed but only
`domains.identity` had a REST surface. The backend-hardening pass needed to
decide how much of the remaining service layer to expose, and how to decide
that consistently going forward.

## Decision
A domain's internal completeness does not by itself justify a public API.
Consent, Risk, Case, Notifications, and Passport were exposed under
`/api/v1/` because each is directly required by an institution or customer
workflow. Partner Applications, Connectors, Profile, and the internal
engine domains (Feature, Rules, Model) remain service-layer-only. Within an
exposed domain, the same discipline applies at the field/action level:
Risk exposes read-only retrieval of already-computed events, not an
evaluation-trigger endpoint, because there is no API-safe way yet to choose
the "right" upstream feature/rule/model run for a caller to trigger against.
Passport sections are minimized by construction (no raw transactions,
balances, or counterparty identities in any section), not filtered
after the fact.

## Consequences
Adding a new domain API is a deliberate proposal, not a default next step
when a domain's services stabilize. `docs/api/domain-apis.md` is the
inventory of what is exposed and the reasoning behind each surface, and
should gain an entry (with reasoning) whenever a new domain API ships.

## Alternatives considered
Exposing every domain's models as generic CRUD viewsets was rejected: it
would have leaked internal engine plumbing (feature/rule/model run
selection, provider internals) to API consumers and made minimization an
after-the-fact filtering problem instead of a design constraint.
