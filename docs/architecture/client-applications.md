# Client applications

```text
Institution web ─┐
                 ├── REST / OpenAPI ── Django modular monolith ── PostgreSQL
Customer mobile ─┘                         │
                                           └── Redis / Celery
```

The backend owns identity, authorization, consent, financial calculations, risk decisions, case transitions, passport permissions, and audit. Clients own platform-appropriate navigation, presentation, input collection, loading/error states, and secure local session handling.

## Institution web

Run `make frontend-dev` and open <http://localhost:3000>. Vite proxies `/health/` and `/api/` to Django at <http://localhost:8000> in development. The production Nginx image uses the same relative paths and proxies them to the Compose `web` service.

## Customer mobile

Copy `mobile/customer-app/.env.example` to `.env` within that workspace and set `EXPO_PUBLIC_API_BASE_URL` for the device:

- iOS simulator: `http://localhost:8000`
- Android emulator: `http://10.0.2.2:8000`
- physical device: the development machine's reachable LAN address

Run `make mobile-start`. Session material belongs in Expo SecureStore; AsyncStorage must not hold tokens.

## Contracts

Runtime responses are validated by schemas in `contracts/client`. Run `make schema` after an intentional Django API change and review the OpenAPI diff with the server change.
