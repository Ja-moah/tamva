# ADR-010: Universal customer application

**Status:** Accepted

## Context

Customers need TAMVA on Android, iOS, and the web. Maintaining a separate responsive React/Vite customer application would duplicate customer navigation, flows, validation, and release work. Expo and React Native can deliver all three targets from one shared application while retaining platform-specific files for genuine platform differences.

This decision supersedes [ADR-009](ADR-009-client-applications.md), which introduced an independent customer web application alongside admin web and mobile.

## Decision

Maintain two client codebases:

- `apps/admin`: the React and TypeScript web application for TAMVA staff and authorized institutional users;
- `mobile`: the React Native and Expo customer application targeting Android, iOS, and web.

Admin web users are represented by `PARTNER_USER` or `PLATFORM_USER`; customer
app users are represented by `CUSTOMER`. Authentication, authorization, tenant
context, and consent remain separate backend decisions.

Do not create or maintain a standalone customer web application. Expo Router, TanStack Query, customer flows, validation, and API logic remain shared across customer targets. Responsive navigation adapts to the available window size, and platform-specific files such as `*.ios.tsx`, `*.android.tsx`, or `*.web.tsx` are introduced only when platform behavior requires them.

Both clients consume shared REST/OpenAPI contracts from `packages/contracts/client`. PostgreSQL remains the source of truth, and Django remains the sole authority for authentication, authorization, tenancy, consent, ledger classification, profile calculations, risk, case transitions, passport permissions, fraud decisions, and auditing.

## Consequences

The repository has one operational web application and one universal customer application. Android, iOS, and customer web share business flows and release validation. Customer web is an Expo output, not a Compose service or `frontend/` workspace. Native device capabilities may use platform-specific adapters without duplicating customer business rules.

## Alternatives considered

A standalone customer React/Vite application was rejected because it would duplicate the customer product. A mobile-only customer application was rejected because customers also require browser access. A universal UI package shared with admin web was rejected because operational and customer experiences have different information architecture and interaction needs.
