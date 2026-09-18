# Ledger

Owns canonical financial history, ledger entries, classification, and reconciliation foundations. Monetary models must use fixed-precision `DecimalField`/PostgreSQL `NUMERIC`, never floating point.

Posting is append-only: canonical transactions produce one idempotent `LedgerPosting`, and corrections create compensating `LedgerEntry` rows rather than rewriting history. Reconciliation records matches and mismatches explicitly; it never changes canonical transactions or ledger facts.

