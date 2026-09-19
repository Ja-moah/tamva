# Deployment

This is the plan for one small VPS (about 2 vCPU / 4 GB RAM) running Docker Compose. It has been
validated as configuration (`make deploy-config`, image builds, migration and restore drills) but
**nothing has been deployed**: no host, domain, DNS, secrets or object store exist yet. Every domain
below is a placeholder driven by `TAMVA_DOMAIN`.

## Architecture

```
Internet ── 80/443 ──► edge (Caddy: TLS, routing, static frontends)
                         ├─ api.<domain>    ─► web (gunicorn, Django)
                         ├─ admin.<domain>  ─► static Admin SPA  (+ same-origin /api/ ─► web)
                         ├─ app.<domain>    ─► static customer web app (Expo web export)
                         ├─ www.<domain>    ─► redirect to app.<domain> (no marketing site yet)
                         └─ docs.<domain>   ─► web /api/docs|redoc|schema (404 unless enabled)

web ┬─ postgres (private network, volume)
    ├─ redis    (private network, volume)
    └─ S3-compatible bucket (external, private)
celery-worker ─ postgres, redis, bucket        celery-beat ─ redis (exactly one instance)
migrate (one-shot: check --deploy, migrate) runs before web/worker/beat start
```

* **One proxy: Caddy.** It owns TLS (automatic Let's Encrypt/ZeroSSL) and is the only container that
  publishes ports. Nginx is not used anywhere in the repository.
* **Admin is same-origin.** `admin.<domain>` serves the SPA and proxies `/api/` to Django, so the
  session and CSRF cookies are first-party. This is why `CSRF_TRUSTED_ORIGINS` names the admin origin.
* **The customer app uses bearer tokens** against `api.<domain>`, hence `CORS_ALLOWED_ORIGINS` names
  `app.<domain>`. Native apps do not use CORS.
* **Object storage is external.** Any S3-compatible service works (AWS S3, Cloudflare R2, Backblaze
  B2, Wasabi, self-hosted MinIO). The bucket must be private. MinIO in `docker-compose.yml` is a
  development tool only.
* **Kubernetes is intentionally not used.** One host, one Compose file.

### Memory budget (4 GB host)

| Service | Limit | Notes |
| --- | --- | --- |
| postgres | 1 GB | `shared_buffers=384MB`, `max_connections=60` |
| web | 768 MB | `WEB_CONCURRENCY` (default 2) gunicorn workers |
| celery-worker | 640 MB | `CELERY_CONCURRENCY` (default 2), recycled every 200 tasks |
| redis | 320 MB | `maxmemory 256mb`, AOF on |
| celery-beat | 256 MB | |
| migrate (transient) | 384 MB | exits before the others grow |
| edge | 128 MB | |

The sum of the steady-state limits is under 3.2 GB, leaving headroom for the OS and page cache. **Build
images off the VPS** (CI or a workstation); the Expo web export in the edge image needs more memory
than the host can spare. Push to a registry and set `TAMVA_IMAGE_TAG`, or build on the host only
with swap enabled.

**Connection pooling.** Each gunicorn worker keeps one persistent connection (`DB_CONN_MAX_AGE=60`,
health-checked), so the steady load is `web workers + worker concurrency + beat` ≈ 6 connections, far
below `max_connections`. PgBouncer is not needed at this size; add it (transaction pooling, and set
`DB_CONN_MAX_AGE=0`) only if you scale the web tier out.

## Prerequisites (decided by the operator, not by this repository)

1. A host with Docker Engine + Compose v2, ports 80/443 open, and a firewall that exposes nothing else.
2. A domain you control, with `A`/`AAAA` records for `api`, `admin`, `app`, `www` (and `docs` if used)
   pointing at the host. Staging needs its own names (for example `*.staging.<domain>`).
3. An SMTP or transactional-email provider (account recovery is unusable without it; the app refuses to
   start on a console/locmem backend).
4. A private S3-compatible bucket and an access key limited to that bucket.
5. Somewhere off the host to keep database backups (see `BACKUP_AND_RESTORE.md`).

## First deployment (staging first)

```bash
cp .env.staging.example .env.staging        # then replace every CHANGE_ME (git-ignored)
make deploy-config                          # validates the compose file
make deploy-staging                         # builds images, runs `migrate`, starts the stack
```

`migrate` runs `manage.py check --deploy`, `migrate --noinput` and `sync_access_catalog` (roles and permissions); `web`, `celery-worker` and
`celery-beat` wait for it to finish successfully. If the environment is unsafe (weak secret, wildcard
hosts, plain-http origins, no email provider, no bucket) the containers **refuse to start** and list
every problem. Then:

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.staging -p tamva-stg ps
curl -fsS https://api.staging.<domain>/health/live/
curl -fsS https://api.staging.<domain>/health/ready/     # PostgreSQL + Redis
curl -fsS https://api.staging.<domain>/api/v1/meta/version/
```

Create the first institution and its administrator (idempotent; the password is read from
`BOOTSTRAP_ADMIN_PASSWORD` or prompted for, never passed as an argument):

```bash
docker compose -f docker-compose.deploy.yml --env-file .env.staging -p tamva-stg run --rm \
  -e BOOTSTRAP_ADMIN_PASSWORD web python apps/backend/manage.py bootstrap_institution \
  --name "<Institution name>" --slug <slug> --admin-email <email>
```

Then walk the acceptance list in `RELEASE_CHECKLIST.md`. Promote to
production with the same steps and `.env.production` / `make deploy-production`.

## Health and readiness

| Endpoint | Meaning | Used by |
| --- | --- | --- |
| `GET /health/live/` | The process answers. No dependency checks, so a database outage never restarts the app in a loop. | Docker `HEALTHCHECK`, Caddy upstream check |
| `GET /health/ready/` | PostgreSQL **and** Redis respond; 503 otherwise. | Deploy verification, external uptime monitor |
| `GET /health/` | Legacy combined status. | Compatibility |

The worker has a `celery inspect ping` healthcheck. Beat has none: watch for the
`purge-expired-exports` / `fail-stale-exports` effects (exports never staying `PENDING`) instead.

## Background work

* **Worker**: `acks_late` with `reject_on_worker_lost`, prefetch 1, soft limit 300 s / hard limit 360 s.
* **Beat (exactly one)**: purge expired exports (hourly), **fail stale exports** (every 5 min),
  dispatch the outbox (every 15 s). Never run two beat containers.
* **Exports cannot stay pending or running forever**: unexpected errors and timeouts mark the job
  `FAILED` with a code; a broker outage at request time leaves it `PENDING`, and `fail_stale_exports`
  closes anything older than `EXPORT_STALE_MINUTES` (15).
* **Outbox events** retry up to 5 times, then are dead-lettered on the row (`published_at` set,
  `last_error` kept) for operator replay.
* **Idempotency**: `run_export_job` only runs a `PENDING` job; the outbox consumer is idempotent per
  `(event, template, channel, recipient)`.

## Logs and tracing

Everything logs JSON to stdout (Docker keeps 5 × 10 MB per service). One `request_completed` line per
request carries `request_id`, `method`, `path` (never the query string), `status`, `duration_ms`,
`user_id` and `tenant_id`. The `request_id` also appears in the `X-Request-ID` response header and in
error bodies, and follows a request into Celery tasks. Bearer tokens, refresh tokens, recovery tokens
and passwords are never logged. Set `SENTRY_DSN` for error reporting (`send_default_pii=False`).

## Upgrades and rollback

1. Take a database backup and record the running `APP_RELEASE`.
2. `git checkout <tag>` on the build machine, build and push images, set `TAMVA_IMAGE_TAG`.
3. `make deploy-<env>` (the `migrate` step runs first).
4. Verify `/health/ready/` and `/api/v1/meta/version/`.

Roll back by redeploying the previous image tag. Migrations are forward-only: if a release contains a
destructive migration, restore the pre-release backup instead (see the checklist).

## What is deliberately not here

No automatic deploy pipeline, no secrets in the repository, no backup automation (see
`BACKUP_AND_RESTORE.md`), no CDN, no multi-host/high-availability setup, and no Kubernetes.
