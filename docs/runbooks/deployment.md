# Deployment Runbook

TAMVA has three supported runtime profiles:

| Environment | Settings module | Compose command | Environment file |
| --- | --- | --- | --- |
| Development | `config.settings.local` | `make up` | `.env` |
| Staging | `config.settings.staging` | `make up-staging` | `.env.staging` |
| Production | `config.settings.production` | `make up-production` | `.env.production` |

## Prepare an environment

Copy the matching template and replace every placeholder with values from the
deployment secret store. The resulting files are ignored by Git:

```bash
cp .env.staging.example .env.staging
cp .env.production.example .env.production
```

Staging and production require a non-default `DJANGO_SECRET_KEY`,
`DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, and `REDIS_URL`. Production also
enables HTTPS redirect and HSTS by default. Set `DJANGO_BEHIND_PROXY=true`
when TLS terminates at a reverse proxy.

## Release sequence

Run migrations before starting application workers:

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml run --rm web python manage.py migrate --noinput
make up-staging
```

Use the equivalent production overlay after staging acceptance:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm web python manage.py migrate --noinput
make up-production
```

Verify `/health/` after each rollout. Keep PostgreSQL and Redis private; the
production overlay removes their host port bindings and restarts application
services automatically.