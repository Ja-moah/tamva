# TAMVA

TAMVA is financial identity and trust infrastructure. This repository provides a production-minded foundation on which the team can build identity, consent, financial data, risk, case-management, and passport capabilities without coupling unrelated domains.

## Architecture

TAMVA starts as a modular monolith: all domain modules deploy as one Django application, but each domain has explicit ownership, a documented responsibility, and narrow public interfaces. PostgreSQL is the source of truth. Redis supports caching and Celery. A transactional outbox provides the foundation for reliable asynchronous events, and institutions provide the shared-database tenancy boundary.

The Django backend is the authoritative application layer. It owns authentication, authorization, tenancy, consent validity, connector orchestration, normalisation, ledger classification, profile calculations, feature generation, rules, risk decisions, case transitions, passport permissions, auditing, and notifications. Client applications may validate basic form input and manage presentation state, but they must display and enforce decisions returned by the backend rather than duplicate authoritative business rules.

```text
                    PostgreSQL
                 SOURCE OF TRUTH
                        ↑
                        │
                  Django Backend
             SOURCE OF BUSINESS LOGIC
                        │
                 REST / OpenAPI
          ┌─────────────┼─────────────┐
          │             │             │
          ↓             ↓             ↓
 Admin/Operations  Customer Web   Customer Mobile
      React           React        React Native
```

| Application surface | Current location | Status | Responsibility |
| --- | --- | --- | --- |
| Customer mobile app | `mobile/customer-app/` | Scaffolded | Native customer journeys and device capabilities |
| Customer web app | `frontend/customer-web/` | Planned | Responsive browser access to customer capabilities |
| Admin/institution/operations web | `frontend/institution-web/` | Scaffolded | Internal operations and external institutional workflows |
| Django backend | `apps/`, `packages/`, and `config/` | Scaffolded | APIs, tenancy, security, persistence, and all authoritative business logic |

Domain code lives under `apps/`; stable cross-domain primitives live under `packages/`; deployment configuration lives under `config/`. Client applications communicate with Django through versioned REST APIs and shared contracts. Modules and clients must not reach into another domain's implementation or database tables arbitrarily.

See the [system overview](docs/architecture/system-overview.md), [tenancy model](docs/architecture/tenancy.md), and [architecture decisions](docs/adr/).

### Admin, institutional, and operations web

This application serves TAMVA staff, institution administrators, risk analysts, investigators, operations teams, API/integration users, and security/governance users. It currently lives at `frontend/institution-web/`; `frontend/admin-web/` is the intended clearer name when the workspace is renamed in a dedicated change.

- React 19 and TypeScript
- Vite
- TanStack Router, Query, and Table
- Tailwind CSS and owned shadcn-style components
- Lucide icons

### Customer web

The responsive React and TypeScript customer web application is a defined application surface but has not yet been scaffolded. Its intended location is `frontend/customer-web/`. It will expose customer capabilities in phone, tablet, laptop, and desktop browsers while relying on the same backend decisions and shared API contracts as the mobile application.

### Customer mobile

The native customer experience lives at `mobile/customer-app/` and is the primary surface for device-specific capabilities such as secure storage, biometrics, push notifications, app lifecycle handling, and future camera or QR workflows.

- React Native and Expo
- TypeScript and Expo Router
- TanStack Query
- NativeWind
- React Hook Form and Zod
- Expo SecureStore

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

- GitHub Actions for pull requests and changes to `main` or `tamva`

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
contracts/  Shared TypeScript runtime schemas and checked OpenAPI output
frontend/   Web clients; currently the admin/institution portal, with customer web planned
mobile/     Customer application (React Native + Expo)
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
- Node.js 22 or newer and npm 11 or newer

Python 3.13+ is needed on the host only when running tooling outside Docker.

## Environment and initial setup

```bash
git clone git@github.com:Ja-moah/tamva.git
cd tamva
git checkout tamva

cp .env.example .env
make bootstrap
```

`make bootstrap` does not overwrite an existing `.env`. It installs locked client dependencies, builds the images, starts PostgreSQL and Redis, applies migrations, runs Django checks, and starts Django, Celery, and the institution portal. `.env` is ignored by Git and must never contain committed secrets.

For subsequent work, the common lifecycle is:

Staging and production use separate settings and secret files. Copy
`.env.staging.example` or `.env.production.example`, fill in the deployment
values, and use `make up-staging` or `make up-production`. See the [deployment
runbook](docs/runbooks/deployment.md) for the release sequence.

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
- `institution-web` — production-built admin/institution/operations React portal behind Nginx on port `3000`

Create and apply migrations with:

```bash
make migrations
make migrate
```

Migration files must be reviewed for locks, reversibility, constraints, and tenant-isolation implications.

## Application URLs

### Development stack

With `make up` or `make bootstrap` running:

| Surface | URL | Notes |
| --- | --- | --- |
| Admin/institution/operations web | <http://localhost:3000/> | Current Compose service and workspace name: `institution-web` |
| Admin portal health proxy | <http://localhost:3000/health/> | Nginx forwards the request to Django |
| Admin portal API documentation proxy | <http://localhost:3000/api/docs/> | Same Swagger UI through the client origin |
| Admin portal OpenAPI proxy | <http://localhost:3000/api/schema/> | Same OpenAPI document through the client origin |
| Customer web | Not available yet | The `frontend/customer-web/` workspace has not been scaffolded |
| Django backend | <http://localhost:8000/> | No public landing view is currently registered at `/` |
| Django Admin | <http://localhost:8000/admin/> | Internal Django administration, separate from the React portal |
| Health check | <http://localhost:8000/health/> | Reports application and database health |
| Swagger UI | <http://localhost:8000/api/docs/> | Interactive API documentation |
| OpenAPI schema | <http://localhost:8000/api/schema/> | Machine-readable schema |
| PostgreSQL | `localhost:5432` | Development only; not published by staging/production overlays |
| Redis | `localhost:6379` | Development only; not published by staging/production overlays |

New public API endpoints belong under `/api/v1/`. At present, the checked OpenAPI contract exposes the health endpoint; domain APIs are added as their backend modules are implemented.

### Customer mobile development

Copy the mobile environment example before starting Expo:

```bash
cp mobile/customer-app/.env.example mobile/customer-app/.env
make mobile-start
```

Expo prints the Metro development URL and QR code at runtime; the repository does not assign a fixed browser URL. Configure `EXPO_PUBLIC_API_BASE_URL` according to the device running the app:

| Runtime | Django API base URL |
| --- | --- |
| iOS simulator | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical device | `http://<development-machine-LAN-address>:8000` |

The development machine and device must be able to reach one another for physical-device testing. Do not commit the generated mobile `.env` file.

### Staging and production

Staging and production hostnames are intentionally not hard-coded in this repository. They are supplied through deployment DNS, TLS termination, `DJANGO_ALLOWED_HOSTS`, CORS/CSRF configuration, and environment-specific secrets. For each deployed environment, the externally configured backend origin provides:

| Endpoint | Path |
| --- | --- |
| Health | `/health/` |
| Django Admin | `/admin/` |
| Swagger UI | `/api/docs/` |
| OpenAPI schema | `/api/schema/` |
| Versioned public APIs | `/api/v1/` |

Production access to Django Admin, Swagger, and the schema should be restricted at the network or identity layer according to the deployment security policy. See the [deployment runbook](docs/runbooks/deployment.md).

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
| `make frontend-install` | Install locked web and mobile dependencies |
| `make frontend-dev` | Run the institution portal with Vite HMR |
| `make frontend-build` | Build the institution portal for production |
| `make frontend-test` | Run institution portal tests |
| `make frontend-typecheck` | Type-check both TypeScript clients |
| `make mobile-start` | Start the Expo customer app |
| `make mobile-android` | Open the Expo Android workflow |
| `make mobile-ios` | Open the Expo iOS workflow |
| `make mobile-build` | Export the Android application bundle |
| `make schema` | Refresh the checked OpenAPI schema |
| `make clients-check` | Verify both client applications |

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
