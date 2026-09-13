# Client applications

```text
Admin web ───────┐
Customer web ────┼── REST / OpenAPI ── Django modular monolith ── PostgreSQL
Customer mobile ─┘                         │
                                           └── Redis / Celery
```

The backend owns identity, authorization, consent, financial calculations, risk decisions, case transitions, passport permissions, and audit. Clients own platform-appropriate navigation, presentation, input collection, loading/error states, and secure local session handling.

## Identity and access context

All three clients use one backend identity and authentication foundation. Django resolves an authenticated identity into a customer, institution-member, or platform-staff actor context and returns the applicable role, institution scope, and permissions. The admin app changes navigation and available actions from those backend permissions; it does not infer access from a locally selected role.

Keep these decisions separate:

- authentication establishes who the user is;
- authorization establishes what the user may do;
- tenant resolution establishes the institution scope;
- consent establishes which customer data may be accessed and for what purpose.

Customer web and mobile share customer-facing API semantics. Admin web uses the same authentication foundation but receives institution or platform authorization context. Proposed authentication routes such as `/api/v1/auth/login/`, `/api/v1/auth/refresh/`, `/api/v1/auth/logout/`, and `/api/v1/me/` remain future contracts until implemented and published by Django.

## Admin web

The application at `frontend/admin/` serves authorized TAMVA staff and institution users. Run `make admin-dev` and open <http://localhost:3000>. Vite proxies `/health/` and `/api/` to Django at <http://localhost:8000> in development. The production Nginx image uses the same relative paths and proxies them to the Compose `web` service.

## Customer web

The responsive application at `frontend/customer/` serves customers using phone, tablet, laptop, and desktop browsers. Run `make customer-dev` and open <http://localhost:3001>. It uses the same Django APIs and runtime response contracts as mobile while keeping browser-specific navigation and presentation local to the app.

## Customer mobile

Copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_BASE_URL` for the device:

- iOS simulator: `http://localhost:8000`
- Android emulator: `http://10.0.2.2:8000`
- physical device: the development machine's reachable LAN address

Run `make mobile-start`. Session material belongs in Expo SecureStore; AsyncStorage must not hold tokens.

## Contracts

Runtime responses are validated by schemas in `contracts/client`. Run `make schema` after an intentional Django API change and review the OpenAPI diff with the server change.
