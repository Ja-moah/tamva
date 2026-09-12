# Local development runbook

Run `make bootstrap`, then `make ps`. Check `/health/` and `/api/docs/`. Use `make logs` for web/worker logs, `make migrate` after pulling migrations, and `make check && make test` before a PR. `make down` stops services without deleting the PostgreSQL volume. Resolve port collisions by changing host-side mappings; do not change container service names in `DATABASE_URL` or Redis URLs.

