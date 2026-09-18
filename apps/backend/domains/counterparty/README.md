# Counterparty

Derives counterparty/beneficiary intelligence entirely from trusted
`normalisation.CanonicalTransaction` records — no external merchant or
beneficiary reputation data. `CounterpartyProfile` is the institution-wide
aggregate; `CustomerCounterpartyRelationship` is the per-customer aggregate
that "first-time counterparty", "frequent counterparty", and concentration
signals are computed from; `CounterpartyObservation` is the append-only
evidence trail (one row per contributing transaction), making replay of the
same transaction a no-op rather than double-counting.

`services.sync_customer_counterparties` is the entry point Feature Engine
calls before deriving counterparty-based feature values.
