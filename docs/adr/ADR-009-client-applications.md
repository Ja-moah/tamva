# ADR-009: Separate institution web and customer mobile clients

**Status:** Accepted

## Context

Institution teams need a dense operational browser workspace. Customers need a mobile-native surface with secure device storage, app lifecycle support, and future biometric, push, camera, and QR capabilities. Django remains the source of business behavior.

## Decision

Build two independent TypeScript clients:

- `frontend/institution-web`: React, Vite, TanStack Router, Query and Table, Tailwind, owned shadcn-style components, and Lucide.
- `mobile/customer-app`: React Native, Expo Router, TanStack Query, NativeWind, React Hook Form, Zod, SecureStore, and Lucide.

Both clients consume Django REST/OpenAPI contracts through `contracts/client`. They may format and present data but never decide consent validity, tenant access, ledger classification, risk, case transitions, or passport permissions. Django Admin remains a restricted internal engineering tool and is not the institution product.

## Consequences

Web and mobile can evolve for their platforms while sharing transport schemas and API semantics. Authentication and authorization must be implemented once in Django. Client release pipelines remain separate.

## Alternatives considered

A responsive customer React website was rejected because mobile is a primary product surface. A single universal UI package was rejected because browser and native interaction primitives differ. Redux was deferred because TanStack Query and local React state cover the current requirements.
