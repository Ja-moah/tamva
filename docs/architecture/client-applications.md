# Client applications
The final ownership model is:

```text
              PostgreSQL
            SOURCE OF TRUTH
                ^
                |
            Django / DRF
          BUSINESS LOGIC + APIs
              ^         ^
              |         |
        apps/admin     mobile
         Admin Web       Customer App
                     Android
                     iOS
                     Web
```


The backend owns identity, authorization, consent, financial calculations, risk decisions, case transitions, passport permissions, and audit. Clients own platform-appropriate navigation, presentation, input collection, loading/error states, and secure local session handling.

## Identity and access context

Both clients use one backend identity and authentication foundation. Django resolves an authenticated identity into one of the supported actor contexts and returns the applicable role, institution scope, and permissions. Admin web supports `PARTNER_USER` and `PLATFORM_USER`; the customer app supports `CUSTOMER`. The admin app changes navigation and available actions from backend permissions; it does not infer access from a locally selected role.

Keep these decisions separate:

- authentication establishes who the user is;
- authorization establishes what the user may do;
- tenant context establishes which institution the actor is operating under;
- consent establishes which customer data may be accessed and for what purpose.

The Expo customer application receives the customer authorization context on Android, iOS, and web. Admin web uses the same authentication foundation but receives institution or platform authorization context. Proposed authentication routes such as `/api/v1/auth/login/`, `/api/v1/auth/refresh/`, `/api/v1/auth/logout/`, and `/api/v1/me/` remain future contracts until implemented and published by Django.

## Admin web

The application at `apps/admin/` is the single operational web platform for
TAMVA platform staff, institution administrators, risk analysts, investigators,
operations staff, security and compliance staff, auditors, API/integration
developers, and other authorized institutional users. It is not customer-facing.
Run `make admin-dev` and open <http://localhost:3000>. Vite proxies `/health/`
and `/api/` to Django at <http://localhost:8000> in development. The production
Nginx image uses the same relative paths and proxies them to the Compose `web`
service.

## Customer application

The application at `apps/mobile/` is one Expo Router codebase for Android, iOS, and
Web. Phone layouts use bottom-tab navigation; wider tablet and desktop layouts
use a sidebar. There is no separate customer web application or customer web
workspace under `frontend/`.

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and set `EXPO_PUBLIC_API_BASE_URL` for the target:

- iOS simulator: `http://localhost:8000`
- Android emulator: `http://10.0.2.2:8000`
- local web browser: `http://localhost:8000`
- physical device: the development machine's reachable LAN address


Run `make mobile-start` for Expo or `make mobile-web` for the web target. `make mobile-build` validates production exports for all three targets. Session material belongs in Expo SecureStore; AsyncStorage must not hold tokens.

The current customer UI provides Home, Activity, Profile, Passport, Protection,
Confidence, Consent, Notifications, and Passport creation flows. Those flows
currently use local mock fixtures and Zustand state for presentation and
interaction testing. They must not be treated as authoritative financial,
consent, risk, or passport decisions. Replace each fixture with a versioned
Django endpoint and shared runtime contract as the corresponding backend module
is implemented. The mobile API client currently wires the shared health check.

## Contracts

Runtime responses are validated by schemas in `packages/contracts/client`. Admin web and mobile consume the same API contracts. Run `make schema` after an intentional Django API change and review the OpenAPI diff with the server change.
