# Release checklist

Versioning is semantic (`MAJOR.MINOR.PATCH`). The single source is the repository-root `VERSION` file:
the backend reads it (`APP_VERSION`, returned by `GET /api/v1/meta/version/`), Mobile takes its
marketing version from it, and `CHANGELOG.md` records what changed. The build id (`APP_RELEASE`, the git
SHA) is baked into the image. **Tags are created by a human after a green release; nothing here tags
or deploys automatically.**

## 1. Prepare (on a branch)

- [ ] `VERSION` bumped; `CHANGELOG.md` has a dated section for it; `Unreleased` emptied.
- [ ] Any API change reflected in `packages/contracts/openapi/schema.yml` (`make schema`, no diff afterwards).
- [ ] New migrations reviewed for locking/rewrites on large tables; no destructive step without a backup
      and a note in the changelog.

## 2. Validate (all must be green)

Backend (through Docker):

- [ ] `make lint` · `make format-check` · `make typecheck` (strict mypy)
- [ ] `make check` and `manage.py check --deploy` under `config.settings.production` (see DEPLOYMENT)
- [ ] `makemigrations --check --dry-run` clean; fresh-database `migrate` twice (BACKUP_AND_RESTORE, last section)
- [ ] `pytest` (full suite) and coverage report reviewed
- [ ] `manage.py spectacular --validate --fail-on-warn` clean
- [ ] `git diff --check` clean

Frontends:

- [ ] `pnpm install --frozen-lockfile`
- [ ] Admin: typecheck, lint, tests, `build`, `verify:build`
- [ ] Mobile quality gates:
      - `pnpm --filter @tamva/mobile lint`
      - `pnpm --filter @tamva/mobile typecheck`
      - `cd apps/mobile && pnpm dlx expo-doctor` (network-backed checks may be skipped in offline CI)
      - Set real API origins first (no localhost/private/example hosts):
        - `export STAGING_API_ORIGIN=https://staging-api.<your-real-domain>`
        - `export PRODUCTION_API_ORIGIN=https://api.<your-real-domain>`
      - Staging export verification (must be explicit and use a real https origin):
        - `EXPO_PUBLIC_APP_ENV=staging EXPO_PUBLIC_API_BASE_URL="$STAGING_API_ORIGIN" pnpm --filter @tamva/mobile export:android`
        - `EXPO_PUBLIC_APP_ENV=staging EXPO_PUBLIC_API_BASE_URL="$STAGING_API_ORIGIN" pnpm --filter @tamva/mobile export:ios`
        - `EXPO_PUBLIC_APP_ENV=staging EXPO_PUBLIC_API_BASE_URL="$STAGING_API_ORIGIN" pnpm --filter @tamva/mobile export:web`
      - Production export verification (must be explicit and use a real https origin):
        - `EXPO_PUBLIC_APP_ENV=production EXPO_PUBLIC_API_BASE_URL="$PRODUCTION_API_ORIGIN" pnpm --filter @tamva/mobile export:android`
        - `EXPO_PUBLIC_APP_ENV=production EXPO_PUBLIC_API_BASE_URL="$PRODUCTION_API_ORIGIN" pnpm --filter @tamva/mobile export:ios`
        - `EXPO_PUBLIC_APP_ENV=production EXPO_PUBLIC_API_BASE_URL="$PRODUCTION_API_ORIGIN" pnpm --filter @tamva/mobile export:web`
      - Demo fixture export verification (separate explicit demo profile):
        - `EXPO_PUBLIC_APP_ENV=development EXPO_PUBLIC_DEMO_MODE=true pnpm --filter @tamva/mobile export:web`
- [ ] Mobile launch validation (do not stop at static checks):
      - `cd apps/mobile && CI=1 pnpm exec expo start --web --port 19006`
      - open `http://localhost:19006` and confirm bundle loading without native-module/runtime errors

Containers:

- [ ] `docker build --target runtime .` (non-root, no test tooling, HEALTHCHECK healthy)
- [ ] `docker build -f deploy/edge/Dockerfile …` with the real `EXPO_PUBLIC_API_BASE_URL`
- [ ] `make deploy-config` valid

## 3. Staging

- [ ] Back up the staging database; deploy with `make deploy-staging`.
- [ ] `/health/live/`, `/health/ready/` and `/api/v1/meta/version/` (correct version, release, environment).
- [ ] Sign in to Admin as the bootstrapped administrator; CSRF and session cookies are `Secure`.
- [ ] Register a customer, sign in on the app, request account recovery and **receive the email**.
- [ ] Customer flow: consent, Home/Activity/Profile, Passport generate + share, revoke; a revoked or
      expired share is refused.
- [ ] Admin flow: risk event → case → resolve; request a CSV export, download it once, confirm the link
      dies after 5 minutes and the artifact is gone after retention.
- [ ] Wrong-tenant and wrong-customer requests are refused (403/404).
- [ ] Logs are JSON, carry `request_id`, and contain no tokens, passwords or query strings.
- [ ] Restore drill from the latest backup completed in the last month (BACKUP_AND_RESTORE).
- [ ] Mobile staging internal-test builds are configured and triggered with EAS:
      - Android installable APK: `cd apps/mobile && eas build --platform android --profile staging`
      - iOS internal path: `cd apps/mobile && eas build --platform ios --profile staging`
      - iOS real-device install still requires Apple Developer signing assets (certificates/profiles/TestFlight or ad-hoc); do not mark complete until Apple-side credentials are in place.

## 4. Production

- [ ] Fresh production backup taken and copied off the host; note its name and the running `APP_RELEASE`.
- [ ] `make deploy-production`; repeat the staging health checks against production.
- [ ] Watch logs and error reporting for 30 minutes.
- [ ] Human creates the tag: `git tag -a vX.Y.Z -m "…"` and pushes it. Publish mobile builds through EAS.

## 5. Roll back

Redeploy the previous image tag (`TAMVA_IMAGE_TAG`). If a migration is not backward compatible, stop
writers and restore the pre-release backup (BACKUP_AND_RESTORE). Record what happened.
