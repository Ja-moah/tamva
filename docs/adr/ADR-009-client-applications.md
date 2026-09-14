# ADR-009: Separate admin web, customer web, and customer mobile clients

**Status:** Historical; superseded by [ADR-010](ADR-010-universal-customer-application.md)

This document records a rejected former three-client model. Its paths and
decisions are historical only. The active repository has no standalone customer
web application; use `frontend/admin/` for admin web and `mobile/` for the
Android, iOS, and Web customer app.

## Context

TAMVA and institution teams need a dense operational browser workspace. Customers need both responsive browser access and a mobile-native surface with secure device storage, app lifecycle support, and future biometric, push, camera, and QR capabilities. Django remains the source of business behavior.

## Decision

Build three independent TypeScript clients:

- `frontend/admin`: React, Vite, TanStack Router, Query and Table, Tailwind, owned shadcn-style components, and Lucide.
- `frontend/customer`: React, Vite, TanStack Router and Query, Tailwind, React Hook Form, Zod, and Lucide.
- `mobile`: React Native, Expo Router, TanStack Query, NativeWind, React Hook Form, Zod, SecureStore, and Lucide.

All clients consume Django REST/OpenAPI contracts through `contracts/client`. They may format and present data but never decide consent validity, tenant access, ledger classification, risk, case transitions, or passport permissions. Django Admin remains a restricted internal engineering tool and is not the admin product.

## Consequences

Admin web, customer web, and mobile can evolve for their users and platforms while sharing transport schemas and API semantics. Authentication is implemented once in Django, with separate customer, institution-member, and platform-staff authorization contexts. Client release pipelines remain separate.

## Alternatives considered

A single universal UI package was rejected because browser and native interaction primitives differ. Separate web applications were retained because customer and operational information architecture differ substantially. Redux was deferred because TanStack Query and local React state cover the current requirements.
