# TAMVA

TAMVA is financial identity and trust infrastructure. This repository is the production-minded foundation for a modular Django monolith: domain modules deploy together today while retaining explicit ownership and future extractability.

## Architecture

PostgreSQL is the transactional source of truth. Redis supports caching and Celery. Domain code lives under `apps/`; stable cross-domain primitives live under `packages/`; deployment configuration lives under `config/`. Domain modules communicate through narrow interfaces and contracts rather than importing each other's implementation details.

See [system overview](docs/architecture/system-overview.md), [tenancy model](docs/architecture/tenancy.md), and the [ADRs](docs/adr/).

## Repository layout

- `apps/` — the 15 owned business-domain modules
- `packages/` — common models, contracts, auth interfaces, events, observability
- `config/` — Django/Celery entry points and environment-specific settings
- `tests/` — unit, integration, contract, e2e, and security suites
- `docs/` — architecture, decisions, security, database, events, and runbooks
- `scripts/` — container entry points and operational helpers

## Prerequisites and installation

Install Docker Engine with Compose v2 and GNU Make. Python 3.13+ is only needed for running outside containers.

```bash
make bootstrap
```

The command creates `.env` only when absent, builds images, starts PostgreSQL and Redis, runs migrations/checks, then starts Django and Celery. Never commit `.env`.

Open `http://localhost:8000/health/`, schema at `/api/schema/`, and Swagger UI at `/api/docs/`. New APIs belong below `/api/v1/`.

## Common commands

```bash
make up                    # start the stack
make down                  # stop the stack
make logs                  # follow logs
make migrate               # apply migrations
make migrations            # create migrations
make superuser             # create an administrator
make test                  # run all tests
make lint                  # lint
make format                # format
make typecheck             # static types
make check                 # all static and Django checks
```

Run `make help` for the complete command list.

One-off tools run as UID/GID `1000:1000` so bind-mounted files remain editable. On a host with different IDs, invoke Make with `LOCAL_UID=<uid> LOCAL_GID=<gid>`.

## Development workflow

Create a focused feature branch from current `main`, work inside the owning module, include tests and documentation, and open a reviewed pull request. Read [CONTRIBUTING.md](CONTRIBUTING.md) before starting. New module-to-module dependencies require an explicit contract and architecture review.
