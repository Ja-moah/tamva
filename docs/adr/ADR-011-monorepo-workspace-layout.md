# ADR-011: Monorepo workspace layout

## Status

Accepted

## Context

Backend, frontend, and mobile dependency ownership was mixed at the repository
root. Root package installation caused dependency confusion, and the physical
layout did not make application ownership clear.

## Decision

Maintain one repository and one workspace with three applications:

- `apps/backend` contains the Django modular monolith, its domains, config,
  shared Python packages, tests, and Python dependency files.
- `apps/admin` contains the institutional React/Vite application.
- `apps/mobile` contains the universal Expo application for Android, iOS, and
  web.
- `packages/contracts` contains app-neutral API contracts.

Django remains one modular monolith, and PostgreSQL remains the authoritative
system of record. The repository root contains orchestration, documentation,
deployment, and workspace configuration only.

## Consequences

Application dependency ownership is explicit and the developer mental model is
simpler. The refactor requires coordinated Docker, CI, Makefile, import, and
documentation updates, and introduces migration/path compatibility work for
existing development environments.