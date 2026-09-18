# Local development runbook

Run `make bootstrap`, then `make ps`. Check `/health/` and `/api/docs/`. Use `make logs` for web/worker logs, `make migrate` after pulling migrations, and `make check && make test` before a PR. `make down` stops services without deleting the PostgreSQL volume. Resolve port collisions by changing host-side mappings; do not change container service names in `DATABASE_URL` or Redis URLs.

The local client surfaces are the admin web application in `apps/admin/` and
the single Expo customer application in `apps/mobile/`. The Expo app supports
Android, iOS, and Web; the Web target is not a separate customer application or
Compose service. Use `make admin-dev` for admin web and `make mobile-web` for the
customer Web target.

