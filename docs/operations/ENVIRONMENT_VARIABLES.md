# Environment variables

Templates: `.env.example` (development), `.env.staging.example`, `.env.production.example`. Copy to
`.env`, `.env.staging`, `.env.production` (all git-ignored). **Nothing in a template is a real secret
or a real domain**; replace every `CHANGE_ME` and every `example.com`. Staging and production validate
the environment at startup (placeholder/weak secret, wildcard or local hosts, non-https origins, a
non-delivering email backend, missing bucket, …), list *every* problem at once and never echo secret
values. A placeholder `DJANGO_SECRET_KEY` is caught; a placeholder database password is not, so review
the file by hand.

"Required (prod)" means `config.settings.production` / `staging` refuse to start without it.

## Deployment (compose and edge)

| Variable | Required | Meaning |
| --- | --- | --- |
| `TAMVA_DOMAIN` | compose | Base domain. Caddy serves `api.`, `admin.`, `app.`, `www.`, `docs.` under it. |
| `TAMVA_ACME_EMAIL` | compose | Contact address for certificate expiry notices. |
| `TAMVA_ENV_FILE` | Makefile | Which env file the services load (set by `make deploy-*`). |
| `TAMVA_IMAGE_TAG` | no | Image tag for `tamva-backend` / `tamva-edge` (default `local`). |
| `WEB_CONCURRENCY` | no | gunicorn workers (default 2). |
| `CELERY_CONCURRENCY` | no | Celery worker processes (default 2). |

`DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` are written out literally
(env files are not interpolated) and must agree with `TAMVA_DOMAIN`.

## Django core

| Variable | Required (prod) | Default | Meaning |
| --- | --- | --- | --- |
| `DJANGO_SETTINGS_MODULE` | yes | `config.settings.local` | `config.settings.staging` or `.production`. |
| `DJANGO_SECRET_KEY` | **yes** | dev placeholder | ≥ 50 chars, ≥ 12 distinct characters, not a placeholder. `python -c "import secrets; print(secrets.token_urlsafe(64))"`. Rotating it invalidates sessions and pending export download links. |
| `DJANGO_DEBUG` | no | `false` | Forced off in production settings. |
| `DJANGO_ALLOWED_HOSTS` | **yes** | `localhost,127.0.0.1` | Exact hosts; no wildcard, no local hosts in production. |
| `CSRF_TRUSTED_ORIGINS` | **yes** | – | Bare `https://` origins that may send cookie-authenticated unsafe requests (the Admin origin). |
| `CORS_ALLOWED_ORIGINS` | **yes** | – | Bare `https://` origins allowed to call the API from a browser (customer web app). |
| `CORS_ALLOW_CREDENTIALS` | no | `false` | Keep `false`: bearer auth needs no cookies. |
| `DJANGO_SECURE_SSL_REDIRECT` | no | `true` (prod) | Redirect http→https. `/health/` is exempt so probes work. |
| `DJANGO_BEHIND_PROXY` | yes behind Caddy | `false` | Trust `X-Forwarded-Proto` from the proxy. Only enable behind a proxy that overwrites it. |
| `DJANGO_NUM_PROXIES` | no | `1` if behind proxy | Trusted `X-Forwarded-For` hops, for throttling and audit IPs. |
| `DJANGO_HSTS_SECONDS` | no | `31536000` | |
| `DJANGO_HSTS_INCLUDE_SUBDOMAINS` | no | `true` | |
| `DJANGO_HSTS_PRELOAD` | no | `false` | Effectively irreversible once submitted to browser lists; enable deliberately. |
| `API_DOCS_ENABLED` | no | `false` (prod) | Serves `/api/docs/`, `/api/redoc/`, `/api/schema/`. |
| `DJANGO_ADMIN_ENABLED` | no | `false` (prod) | Serves Django's built-in admin (needs static files; not provisioned). |

## Database, cache, queue

| Variable | Required (prod) | Default | Meaning |
| --- | --- | --- | --- |
| `DATABASE_URL` | **yes** | dev URL | `postgresql://user:pass@host:5432/db`. Add `?sslmode=require` (or `verify-full`) when Postgres is not on the private compose network. |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | compose | – | Used by the `postgres` container; keep consistent with `DATABASE_URL`. |
| `DB_CONN_MAX_AGE` | no | `60` | Seconds a connection is kept (health-checked). |
| `DB_CONNECT_TIMEOUT_SECONDS` | no | `10` | |
| `DB_STATEMENT_TIMEOUT_MS` | no | `0` (off) | Set (e.g. `30000`) to bound runaway queries. |
| `REDIS_URL` | **yes** | dev URL | Cache and throttle counters. |
| `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` | no | Redis db 1 / 2 | |
| `CELERY_TASK_SOFT_TIME_LIMIT` / `CELERY_TASK_TIME_LIMIT` | no | `300` / `360` | Seconds. `EXPORT_STALE_MINUTES` must exceed the hard limit. |
| `OUTBOX_DISPATCH_INTERVAL_SECONDS` | no | `15` | Beat interval for the outbox. |

## Private object storage (exports)

| Variable | Required (prod) | Default | Meaning |
| --- | --- | --- | --- |
| `EXPORT_STORAGE_BACKEND` | **`s3`** | `filesystem` | `filesystem` is development/test only. |
| `AWS_STORAGE_BUCKET_NAME` | **yes** | – | Private bucket. |
| `AWS_S3_ENDPOINT_URL` | no | AWS | Set for R2/B2/MinIO/other S3-compatible services. |
| `AWS_S3_REGION_NAME` | no | – | |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | yes | – | Key restricted to the one bucket. |
| `AWS_S3_ADDRESSING_STYLE` | no | `auto` | `path` for MinIO. |
| `AWS_QUERYSTRING_EXPIRE` | no | `60` | Lifetime (s) of any signed URL. Downloads are streamed through the API, which adds a 5-minute app token and an audit record. |
| `AWS_S3_SSE` | no | – | e.g. `AES256` or `aws:kms` to request server-side encryption. |
| `EXPORT_RETENTION_HOURS` | no | `24` | Artifacts are deleted after this. |
| `EXPORT_LINK_TTL_SECONDS` | no | `300` | Download token lifetime. |
| `EXPORT_MAX_ROWS` | no | `50000` | Larger exports fail rather than truncate. |
| `EXPORT_STALE_MINUTES` | no | `15` | Pending/running exports older than this are failed. |

Objects are keyed `exports/<institution_id>/<job_id>.<ext>`, never overwritten, and never public.

## Email and account recovery

| Variable | Required (prod) | Default | Meaning |
| --- | --- | --- | --- |
| `EMAIL_BACKEND` | no | SMTP | Console/locmem/file/dummy backends are refused in production. |
| `EMAIL_HOST` / `EMAIL_PORT` | **yes** / no | – / `587` | Real provider; `localhost` is refused. |
| `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | **yes** | – | |
| `EMAIL_USE_TLS` | no | `true` | |
| `EMAIL_TIMEOUT_SECONDS` | no | `10` | |
| `DEFAULT_FROM_EMAIL` | **yes** | `…@tamva.invalid` | A real, provider-verified sender. |
| `RECOVERY_LINK_BASE` | **yes** | `tamva://reset-password` | The link customers open (https). Recovery tokens appear only in the outgoing message, never in logs. |
| `RECOVERY_TOKEN_LIFETIME_MINUTES` | no | `60` | |

A failed recovery email is logged as `recovery_email_delivery_failed` (user id only) and the API
answers exactly as for an unknown address.

## Rate limits (`N/min`, `N/hour`)

`THROTTLE_RATE_AUTH` 20/min · `_CREDENTIAL_OPS` 20/min · `_CONNECTOR_SYNC` 30/min · `_RISK_EVALUATION`
60/min · `_PASSPORT_ACCESS` 30/min · `_SECURITY_OBSERVATION` 120/min · `_EXPORT` 10/min · `_BULK`
20/min · `_REGISTRATION` 10/hour · `_RECOVERY` 10/hour · `_CUSTOMER_WRITE` 30/min (per user) ·
`_USER` 600/min (per signed-in user) · `_ANON` 120/min (per client IP).

## Observability and release

| Variable | Default | Meaning |
| --- | --- | --- |
| `LOG_LEVEL` | `INFO` | JSON logs to stdout. |
| `SENTRY_DSN` | – | Enables error reporting (`send_default_pii=False`). |
| `APP_ENVIRONMENT` | `production`/`staging` | Label returned by `/api/v1/meta/version/`. |
| `APP_VERSION` | `VERSION` file | Overrides the version file. |
| `APP_RELEASE` | build arg | Build id (git SHA); baked into the image and returned by the version endpoint. |

## Admin (build time, Vite)

| Variable | Meaning |
| --- | --- |
| `VITE_API_BASE_URL` | Empty in production: the API is same-origin through the edge proxy. |
| `VITE_API_PROXY_TARGET` | Development proxy target only (default `http://localhost:8000`). |

## Mobile / customer web (build time, public)

`EXPO_PUBLIC_*` values are compiled into the bundle: **never** put a secret in them.

| Variable | Meaning |
| --- | --- |
| `EXPO_PUBLIC_APP_ENV` | `development` (default), `staging`, `production`. |
| `EXPO_PUBLIC_API_BASE_URL` | Required for staging/production: a bare `https://` origin on a real host. Localhost, private/LAN, `10.0.2.2` and placeholder domains fail the build. |
| `EXPO_PUBLIC_DEMO_MODE` | Development only; refused in staging/production. |
| `APP_VARIANT` | Selects app name and package/bundle ids (set by the EAS profile). |
| `TAMVA_ANDROID_PACKAGE` / `TAMVA_IOS_BUNDLE_ID` | Override the placeholder application ids. |
| `TAMVA_BUILD_NUMBER` | Android `versionCode` / iOS `buildNumber` (EAS auto-increments in production). |

## Bootstrap

`BOOTSTRAP_ADMIN_PASSWORD` is read only by `manage.py bootstrap_institution`; pass it for that one
command, do not store it in an env file.
