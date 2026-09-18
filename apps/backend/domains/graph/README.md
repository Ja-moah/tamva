# Graph

Owns the relationship abstraction between customers, accounts, counterparties,
cases, and risk events, derived only from TAMVA's own trusted records. It
uses PostgreSQL; no graph database is installed and none is needed at this
scale.

This is not a social network and invents nothing: every edge exists because a
specific source record (a connection, an account, a canonical transaction, a
case, a case-risk-event link) says it does.

## Tenant isolation

Every `GraphNode` is scoped by `institution`, so the same customer produces a
distinct node per institution — there is no shared/global node an
institution could read another institution's relationship data through.
`institution_count` is deliberately left `unavailable` rather than computed:
a genuine cross-institution count would require a platform-scoped aggregate
with its own privacy policy, which does not exist yet, and computing it here
would mean silently crossing the tenant boundary this domain otherwise
enforces everywhere else.

## Provenance

`GraphEdge` is a live, upserted fact (occurrence count, first/last seen).
`GraphEvidence` is the append-only trail behind it: one row per contributing
source record, so "why does this edge exist" always has an exact answer, and
reprocessing the same source record is a no-op rather than double-counting.

## Metrics

`GraphComputationRun` + `GraphMetric` are versioned per `(institution,
customer, graph_version, source_fingerprint)`; a run is never mutated after
creation — a new run is created instead. Metrics follow the same
available/unavailable-with-reason pattern as `FeatureValue`
(`domains.feature`), so an unsupported or not-yet-meaningful metric is
explicit rather than fabricated.

## Out of scope here

Final risk decisions, passport sharing, graph visualization, an external
graph database, and speculative social/network inference are not
implemented in this domain.
