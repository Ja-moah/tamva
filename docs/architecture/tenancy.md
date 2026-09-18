# Institution tenancy

TAMVA uses shared PostgreSQL tables with institution-scoped rows; it does not create a database per institution. `Institution` is the tenant and `InstitutionMembership` connects a human identity to it. Identity type is descriptive and does not grant access.

Every tenant-owned query must receive a trusted server-derived tenant context and filter by institution. Authorization must verify both membership and resource ownership; request fields and front-end filters are untrusted. Background tasks and events carry an explicit tenant identifier. Negative isolation tests exist per domain (`tests/security/test_<domain>_access.py`) and end to end (`tests/e2e/test_full_backend_flow.py` proves the boundary holds mid-pipeline, not just at its edges). Future work should still provide tenant-aware repository/query helpers and administrative break-glass audit controls.

