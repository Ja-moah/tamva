# Institution tenancy

TAMVA uses shared PostgreSQL tables with institution-scoped rows; it does not create a database per institution. `Institution` is the tenant and `InstitutionMembership` connects a human identity to it. Identity type is descriptive and does not grant access.

Every tenant-owned query must receive a trusted server-derived tenant context and filter by institution. Authorization must verify both membership and resource ownership; request fields and front-end filters are untrusted. Background tasks and events carry an explicit tenant identifier. Future work should provide tenant-aware repository/query helpers, negative isolation tests, membership roles and scopes, and administrative break-glass audit controls.

