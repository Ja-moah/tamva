# Backup and restore

> **Status: no backups exist.** Nothing in this repository schedules, runs or verifies a backup, and no
> backup destination has been provisioned. This document describes what must be set up and a restore
> drill that has been exercised against the development database. Until an operator has configured
> backups **and** completed a restore drill in staging, production must be treated as unprotected.

## What holds state

| Store | Contents | Loss impact | Protection |
| --- | --- | --- | --- |
| PostgreSQL (`postgres_data`) | Everything authoritative: identities, consent, ledger, profiles, cases, audit, passport shares | Total | **Back up.** Logical dump (below) plus, if the provider offers it, volume/disk snapshots. |
| Object storage bucket | Export artifacts only (retained 24 h, regenerable) | Low: users re-request the export | Enable bucket versioning/lifecycle at the provider if wanted; not required for recovery. |
| Redis (`redis_data`) | Cache, throttle counters, queued Celery tasks | Low: cache and counters rebuild; queued work is lost, stuck exports are failed by `fail_stale_exports` | AOF is on; no backup needed. |
| Caddy volume (`caddy_data`) | TLS certificates and ACME account | Low: re-issued automatically (mind provider rate limits) | Optional. |
| `.env.production` and secrets | Configuration | High | Keep in a password manager / secret store, **not** in the same place as the database dumps. |

`DJANGO_SECRET_KEY` is not needed to read a restored database (passwords and tokens are hashed with
their own salts/SHA-256), but losing it invalidates sessions and export download links.

## Recommended baseline

* Nightly logical dump (`pg_dump -Fc`) shipped **off the host**, encrypted, to a bucket that is not the
  application bucket and whose credentials the application does not hold.
* Retention: 7 daily, 4 weekly, 6 monthly (adjust to policy and regulation).
* A backup taken **immediately before every release** (see `RELEASE_CHECKLIST.md`).
* A monthly restore drill in staging, with the result recorded.
* Alert when the newest backup is older than 26 hours.

RPO with nightly dumps is up to 24 h. If that is unacceptable, use managed PostgreSQL with point-in-time
recovery or WAL archiving instead of relying on this document.

## Taking a backup

```bash
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
docker compose -f docker-compose.deploy.yml --env-file .env.production -p tamva-prod exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "tamva-$STAMP.dump"
# encrypt and copy off the host, e.g.:
age -r <recipient-public-key> -o "tamva-$STAMP.dump.age" "tamva-$STAMP.dump" && shred -u "tamva-$STAMP.dump"
```

`-Fc` (custom format) is compressed and allows selective, parallel restore. Dumps contain personal and
financial data: encrypt them, restrict access, and delete them on schedule.

## Restore drill (do this in staging, never over production data)

This exact sequence was run against the development database: dump, restore into a scratch database,
compare a row count (`django_migrations`: 26 = 26).

```bash
# 1. Create a scratch database beside the real one
docker compose exec -T postgres psql -U tamva -d postgres -c "CREATE DATABASE tamva_restore_drill"

# 2. Restore (fails on the first error instead of continuing silently)
docker compose exec -T postgres pg_restore -U tamva -d tamva_restore_drill --no-owner --exit-on-error < tamva.dump

# 3. Verify: same migration count, and the application starts against it
docker compose exec -T postgres psql -U tamva -d tamva_restore_drill -Atc "select count(*) from django_migrations"
docker compose run --rm -e DATABASE_URL=postgresql://tamva:<pw>@postgres:5432/tamva_restore_drill web \
  python apps/backend/manage.py migrate --check      # exit 0 = schema matches the code

# 4. Spot-check business data (institution, customer, audit counts) and sign in to the Admin against it

# 5. Clean up
docker compose exec -T postgres psql -U tamva -d postgres -c "DROP DATABASE tamva_restore_drill"
```

Record: date, dump used, dump age, time to restore, row counts, who ran it, and any problems.

## Restoring production after a failure

1. Stop writers: `docker compose … stop web celery-worker celery-beat edge` (keep `postgres` up).
2. Keep the damaged data: `ALTER DATABASE … RENAME TO tamva_damaged_<date>` (or snapshot the volume).
3. Create an empty database, `pg_restore` the newest good dump, then `migrate --check`.
4. Start `web`, worker and beat; run the release checklist's smoke tests.
5. Anything written after the dump is **lost**; reconcile from provider re-syncs and customers' own
   records, and tell affected institutions.

## Fresh-database and re-migrate check

Run this in CI or before releases that add migrations:

```bash
docker compose exec -T postgres psql -U tamva -d postgres -c "CREATE DATABASE tamva_drill"
DATABASE_URL=postgresql://tamva:tamva@postgres:5432/tamva_drill python apps/backend/manage.py migrate --noinput   # from empty
DATABASE_URL=… python apps/backend/manage.py migrate --noinput          # second run: "No migrations to apply"
python apps/backend/manage.py makemigrations --check --dry-run          # "No changes detected"
```
