# Changelog

All notable changes are recorded here. The version lives in `VERSION` (semantic versioning); see
`docs/operations/RELEASE_CHECKLIST.md`.

## [Unreleased]

## [0.1.0] - pending first release

First release candidate: the complete modular-monolith backend (identity, consent, connectors, ledger,
profile, confidence, risk, cases, passport, security signals, graph, audit, notifications, operations),
the institutional Admin, the customer app (Android, iOS, web) and the customer platform APIs.

### Security and hardening
- Production/staging refuse to start on unsafe configuration (weak secret, wildcard/local hosts,
  non-https origins, non-delivering email, missing private storage) and list every problem at once.
- Cookie login is rate limited; customer writes have a per-user limit; global user/anon backstops added.
- A Passport share now re-checks the customer's consent on every read; revoking consent ends access.
- Webhook endpoints cannot target loopback, private, link-local or internal hosts.
- Recovery-email failures are logged (no token, no address) instead of swallowed.
- HSTS preload is opt-in; secure, HttpOnly, SameSite cookies; referrer, frame and COOP headers.

### Infrastructure
- Multi-stage, non-root backend image (no test tooling); split runtime/dev dependency locks.
- Single-host Docker Compose deployment behind Caddy (TLS, hostnames from `TAMVA_DOMAIN`); one-shot
  migration service; exactly one Celery beat.
- Private S3-compatible object storage for exports (MinIO in development); exports never stay
  pending or running forever.
- Structured request logs with request-id propagation into Celery; JSON error pages.

### Frontends
- Admin: self-hosted fonts, no demo imagery, build verifier in CI, generated build output no longer tracked.
- Mobile: development/staging/production configuration that fails the build on unsafe API targets;
  EAS profiles.
