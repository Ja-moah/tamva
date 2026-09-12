# TAMVA

TAMVA is financial identity and trust infrastructure. This repository provides a production-minded foundation on which the team can build identity, consent, financial data, risk, case-management, and passport capabilities without coupling unrelated domains.

## Architecture

TAMVA starts as a modular monolith: all domain modules deploy as one Django application, but each domain has explicit ownership, a documented responsibility, and narrow public interfaces. PostgreSQL is the transactional system of record. Redis supports caching and Celery. A transactional outbox provides the foundation for reliable asynchronous events, and institutions provide the shared-database tenancy boundary.

Domain code lives under `apps/`; stable cross-domain primitives live under `packages/`; deployment configuration lives under `config/`. Modules must not reach into another domain's implementation or tables arbitrarily.

See the [system overview](docs/architecture/system-overview.md), [tenancy model](docs/architecture/tenancy.md), and [architecture decisions](docs/adr/).

## Technology stack

### Backend

- Python 3.13
- Django 5.2
- Django REST Framework
- Celery

### Database and infrastructure

- PostgreSQL 17
- Redis 7
- Docker
- Docker Compose

### API

- REST
- OpenAPI and Swagger via drf-spectacular

### Testing and quality

- pytest and pytest-django
- Ruff linting and formatting
- mypy with Django type support
- coverage
- pre-commit

### CI/CD

- GitHub Actions for pull requests and changes to `main`

### Architecture foundations

- Modular monolith
- PostgreSQL transactional system of record
- Domain-based Django apps
- Transactional outbox foundation
- Institution-based multi-tenancy foundation

## Repository structure

```text
apps/       Domain-owned Django applications
config/     Django settings, URLs, WSGI/ASGI, and Celery setup
packages/   Shared contracts, common primitives, events, auth, and observability
tests/      Unit, integration, contract, end-to-end, and security suites
docs/       Architecture, ADRs, API, events, database, security, and runbooks
scripts/    Container entry points and operational helpers
.github/    CI workflow, pull-request template, and CODEOWNERS example
```

Each directory under `apps/` contains a README defining that domain's responsibility and exclusions.

## Prerequisites

- Git with access to `Ja-moah/tamva`
- Docker Engine
- Docker Compose v2
- GNU Make

Python 3.13+ is needed on the host only when running tooling outside Docker.

## Environment and initial setup

```bash
git clone git@github.com:Ja-moah/tamva.git
cd tamva
git checkout tamva

cp .env.example .env
make bootstrap
```

`make bootstrap` does not overwrite an existing `.env`. It builds the images, starts PostgreSQL and Redis, applies migrations, runs Django checks, and starts Django and Celery. `.env` is ignored by Git and must never contain committed secrets.

For subsequent work, the common lifecycle is:

```bash
make up
make migrate
make test
make check
```

## Docker and database

The development Compose stack contains:

- `web` — Django development server on port `8000`
- `postgres` — PostgreSQL 17 on port `5432`, with a persistent named volume
- `redis` — Redis 7 on port `6379`
- `celery-worker` — Celery using the same application image and environment

Create and apply migrations with:

```bash
make migrations
make migrate
```

Migration files must be reviewed for locks, reversibility, constraints, and tenant-isolation implications.

## Local URLs

With the development stack running:

- Application: <http://localhost:8000/>
- Health check: <http://localhost:8000/health/>
- Swagger UI: <http://localhost:8000/api/docs/>
- OpenAPI schema: <http://localhost:8000/api/schema/>

New public API endpoints belong under `/api/v1/`.

## Developer commands

| Command | Purpose |
| --- | --- |
| `make build` | Build application images |
| `make up` | Start the development stack |
| `make down` | Stop the development stack |
| `make restart` | Restart running services |
| `make logs` | Follow service logs |
| `make ps` | Show service status and health |
| `make shell` | Open a Django shell |
| `make django-shell` | Alias for the Django shell |
| `make db-shell` | Open a PostgreSQL shell |
| `make migrations` | Generate Django migrations |
| `make migrate` | Apply Django migrations |
| `make superuser` | Create a Django administrator |
| `make test` | Run the complete test suite |
| `make test-unit` | Run unit tests |
| `make test-integration` | Run integration tests |
| `make lint` | Run Ruff lint checks |
| `make format` | Format Python files with Ruff |
| `make typecheck` | Run mypy |
| `make check` | Run lint, format, type, and Django checks |

Run `make help` for the authoritative command list. One-off tools default to UID/GID `1000:1000` so bind-mounted files remain editable. On hosts with different IDs, invoke Make with `LOCAL_UID=<uid> LOCAL_GID=<gid>`.

## Team Development Workflow

The shared branch flow is:

```text
main
  ↑
tamva
  ↑
feature branches
```

- `main` is the stable, accepted release branch.
- `tamva` is the shared integration and acceptance branch.
- Feature branches start from the latest `tamva`.
- Nobody develops or pushes feature commits directly on `main` or `tamva`.
- Feature pull requests target `tamva`.
- Once integrated work is fully tested and accepted, a release pull request promotes `tamva` to `main`.
- This repository does not use a `develop` branch.

### Start a feature

```bash
git checkout tamva
git pull origin tamva
git checkout -b feat/<feature-name>
```

Use a focused name such as `feat/identity-auth`, `feat/ledger-engine`, or `feat/risk-engine`. Work inside the owning domain, avoid unrelated refactors, and include tests and documentation.

### Submit work for review

```bash
make check
make test

git add .
git commit -m "feat(domain): short description"
git push -u origin feat/<feature-name>
```

Open a pull request from `feat/<feature-name>` into `tamva`. Complete the pull-request template and obtain review before merge. Release pull requests flow from `tamva` into `main` only after the integrated branch passes its complete acceptance checks.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the review and change-management rules.

## Before Your AI Touches the Code

Before allowing an AI agent to inspect or modify the repository, instruct it to read:

- `AGENTS.md`
- `AI_GOVERNANCE.md`
- the assigned domain skill
- relevant ADRs under `docs/adr/`
- the relevant module README under `apps/<domain>/README.md`

`AGENTS.md` and `AI_GOVERNANCE.md` are currently **pending** and do not yet exist in this repository. Do not tell an AI agent that it has read them until the team creates and reviews them. Domain skills are also team-assigned resources and are not fabricated by this setup update.
