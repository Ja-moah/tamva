# Profile

Owns versioned financial-profile snapshots and income, cash-flow, savings, and debt aggregates derived from canonical ledger data.

Profile computation reads append-only ledger entries only. Each snapshot records its period, computation version, source fingerprint, account coverage, confidence, and ledger/account provenance. Recomputing identical inputs reuses the existing snapshot; changed ledger inputs create a new historical snapshot.

