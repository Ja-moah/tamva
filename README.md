# TAMVA

TAMVA is financial identity and trust infrastructure. This repository provides a production-minded foundation on which the team can build identity, consent, financial data, risk, case-management, and passport capabilities without coupling unrelated domains.

## Architecture

TAMVA starts as a modular monolith: all domain modules deploy as one Django application, but each domain has explicit ownership, a documented responsibility, and narrow public interfaces. PostgreSQL is the source of truth. Redis supports caching and Celery. A transactional outbox provides the foundation for reliable asynchronous events, and institutions provide the shared-database tenancy boundary.

TAMVA has three application layers:

1. **Backend** - Django and Django REST Framework in `apps/backend/`. It owns
  all authoritative business, authorization, tenancy,
  consent, risk, ledger, profile, passport, and case decisions.
2. **Admin Web** - the React and TypeScript application in `apps/admin/` for
  TAMVA staff and authorized institutional users.
3. **Customer App** - one shared React Native and Expo codebase in `apps/mobile/`,
  officially supporting Android, iOS, and Web.

There is no separate customer web application. The customer web experience is
delivered from the same Expo/React Native codebase in `apps/mobile/`.

The Django backend is the authoritative application layer. It owns authentication, authorization, tenancy, consent validity, connector orchestration, normalisation, ledger classification, profile calculations, feature generation, rules, risk decisions, case transitions, passport permissions, auditing, and notifications. Admin web and mobile may validate basic form input and manage presentation state, but they must display and enforce decisions returned by the backend rather than duplicate authoritative business rules.

```text
                    PostgreSQL
                 SOURCE OF TRUTH
                        ↑
                        │
                  Django Backend
             SOURCE OF BUSINESS LOGIC
                        │
                 REST / OpenAPI
                 ┌──────┴──────┐
                 │             │
                 ↓             ↓
        Admin/Operations   Customer App
             React         React Native
                         Android/iOS/Web
```

| Application surface | Current location | Status | Responsibility |
| --- | --- | --- | --- |
| Customer application | `apps/mobile/` | Scaffolded | Shared customer journeys for Android, iOS, and web |
| Admin/institution/operations web | `apps/admin/` | Scaffolded | Internal operations and external institutional workflows |
| Django backend | `apps/backend/` | Core domain chain complete, hardened | APIs, tenancy, security, persistence, and all authoritative business logic |

Domain code lives under `apps/backend/domains/`; stable Python primitives live under
`apps/backend/packages/`; shared client contracts live under `packages/contracts/`.
Client applications communicate with Django through versioned REST APIs and shared
contracts. Modules and clients must not reach into another domain's implementation
or database tables arbitrarily.

See the [system overview](docs/architecture/system-overview.md), [tenancy model](docs/architecture/tenancy.md), and [architecture decisions](docs/adr/).

### Admin, institutional, and operations web

This application lives at `apps/admin/` and serves TAMVA platform staff,
institution administrators, risk analysts, investigators, operations staff,
security and compliance staff, auditors, API/integration developers, and other
authorized institutional users. It is not customer-facing. It is one application
with backend-controlled menus, roles, permissions, and institution scopes, not
separate frontends for each operational role.

- React 19 and TypeScript
- Vite
- TanStack Router, Query, and Table
- Tailwind CSS and owned shadcn-style components
- Lucide icons

### Customer application

The customer experience lives directly at `apps/mobile/` and uses one shared codebase for Android, iOS, and web. Navigation adapts from bottom tabs on phones to a wider sidebar layout on tablets and desktop browsers. Platform-specific files are used only when a capability genuinely differs. Device targets can support secure storage, biometrics, push notifications, app lifecycle handling, and future camera or QR workflows.

- React Native and Expo
- TypeScript and Expo Router
- Android, iOS, and web targets
- TanStack Query
- NativeWind
- React Hook Form and Zod
- Expo SecureStore

The current customer release includes Home, Activity, Profile, Passport,
Protection, Confidence, Consent, Notifications, and Passport creation flows.
These screens use the local Zustand store and mock fixtures while the
corresponding Django domain APIs are implemented. The shared health request is
available through `apps/mobile/lib/api/`; customer decisions and financial data must
move to versioned backend contracts before production use.

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
- ESLint for admin and mobile clients

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
tamva/
├── apps/
│   ├── backend/          Django modular monolith and Python dependencies
│   ├── admin/            Institutional React/Vite application
│   └── mobile/           Universal Expo customer application
├── packages/contracts/   Shared TypeScript schemas and checked OpenAPI output
├── docs/                 Architecture, ADRs, API, security, and runbooks
├── scripts/              Container entry points and operational helpers
├── pnpm-workspace.yaml   Workspace package ownership
├── .github/              CI workflow and contribution templates
├── Makefile
├── docker-compose.yml
├── README.md
├── CONTRIBUTING.md
└── SECURITY.md
```

Each directory under `apps/backend/domains/` contains a README defining that
domain's responsibility and exclusions.

## Prerequisites

- Git with access to `Ja-moah/tamva`
- Docker Engine
- Docker Compose v2
- GNU Make
- Node.js 22 or newer and pnpm 11 or newer (via Corepack)

Python 3.13+ is needed on the host only when running tooling outside Docker.

## Environment and initial setup

```bash
git clone git@github.com:Ja-moah/tamva.git
cd tamva
git checkout tamva

cp .env.example .env
make bootstrap
```

`make bootstrap` does not overwrite an existing `.env`. It installs locked client dependencies, builds the images, starts PostgreSQL and Redis, applies migrations, runs Django checks, and starts Django, Celery, and the admin portal. `.env` is ignored by Git and must never contain committed secrets.

For subsequent work, the common lifecycle is:

Staging and production use separate settings and secret files. Copy
`.env.staging.example` or `.env.production.example`, fill in the deployment
values, and use `make deploy-staging` or `make deploy-production` (Docker Compose behind
Caddy on a single host). Start with [docs/operations/DEPLOYMENT.md](docs/operations/DEPLOYMENT.md);
nothing is deployed by this repository automatically.

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
- `admin` — production-built admin/institution/operations React portal behind Nginx on port `3000`

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
| Admin/institution/operations web | <http://localhost:3000/> | Compose service `admin`; source in `apps/admin/` |
| Admin portal health proxy | <http://localhost:3000/health/> | Nginx forwards the request to Django |
| Admin portal API documentation proxy | <http://localhost:3000/api/docs/> | Same Swagger UI through the client origin |
| Admin portal OpenAPI proxy | <http://localhost:3000/api/schema/> | Same OpenAPI document through the client origin |
| Customer app web target | <http://localhost:8081/> | Started with `make mobile-web`; served from the shared Expo app, not Compose |
| Django backend | <http://localhost:8000/> | No public landing view is currently registered at `/` |
| Django Admin | <http://localhost:8000/admin/> | Internal Django administration, separate from the React portal |
| Health check | <http://localhost:8000/health/> | Reports application and database health |
| Swagger UI | <http://localhost:8000/api/docs/> | Interactive API documentation |
| OpenAPI schema | <http://localhost:8000/api/schema/> | Machine-readable schema |
| PostgreSQL | `localhost:5432` | Development only; not published by staging/production overlays |
| Redis | `localhost:6379` | Development only; not published by staging/production overlays |

New public API endpoints belong under `/api/v1/`. At present, the checked OpenAPI contract exposes the health endpoint; the merged customer screens use mock fixtures until their domain APIs are added to Django and published in the checked OpenAPI schema.

### Customer application development

Copy the mobile environment example before starting Expo:

```bash
cp apps/mobile/.env.example apps/mobile/.env
make mobile-start
```

Expo prints the Metro development URL and QR code at runtime; the repository does not hard-code that URL. Use `make mobile-web` for the browser target. Configure `EXPO_PUBLIC_API_BASE_URL` according to the target running the app:

| Runtime | Django API base URL |
| --- | --- |
| iOS simulator | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Local web browser | `http://localhost:8000` |
| Physical device | `http://<development-machine-LAN-address>:8000` |

The development machine and device must be able to reach one another for physical-device testing. Do not commit the generated mobile `.env` file.

### Staging and production

Staging and production hostnames are intentionally not hard-coded in this repository. They are supplied through deployment DNS, TLS termination, `DJANGO_ALLOWED_HOSTS`, CORS/CSRF configuration, and environment-specific secrets. The customer web target is produced by `make mobile-build-web` and deployed as the web output of the Expo application; it is not a second source workspace or a Docker Compose service. For each deployed environment, the externally configured backend origin provides:

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
| `make check` | Run backend and client lint, formatting, type, build, and Django checks |
| `make frontend-install` | Install locked web and mobile dependencies |
| `make frontend-dev` | Run the admin portal with Vite HMR |
| `make frontend-build` | Build the admin web application for production |
| `make frontend-test` | Run the admin web application test suite |
| `make frontend-typecheck` | Type-check the admin web application and mobile |
| `make admin-dev` | Run the admin portal with Vite HMR on port `3000` |
| `make admin-build` | Build the admin portal for production |
| `make admin-test` | Run admin portal tests |
| `make mobile-start` | Start the Expo customer app |
| `make mobile-web` | Start the Expo customer app for web |
| `make mobile-android` | Open the Expo Android workflow |
| `make mobile-ios` | Open the Expo iOS workflow |
| `make mobile-lint` | Lint shared Android, iOS, and web customer code |
| `make mobile-build` | Export Android, iOS, and web customer bundles |
| `make mobile-build-android` | Export the Android customer bundle |
| `make mobile-build-ios` | Export the iOS customer bundle |
| `make mobile-build-web` | Export the customer web build |
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
