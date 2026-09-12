# Security policy

Report vulnerabilities privately to the designated security contact; do not open a public issue with exploit details. Until a contact is configured, notify the repository administrators privately.

Secrets come only from the environment or an approved secret manager. Production rejects the example secret and enables secure cookies, HSTS, content-type protection, and HTTPS redirect. Configure `DJANGO_BEHIND_PROXY=true` only behind a trusted proxy that overwrites `X-Forwarded-Proto`; the production Compose overlay assumes that topology and is not a standalone deployment recipe. CSRF and CORS origin lists must be explicit.

API permission policy is default-deny. Tenant access must be checked server-side against institution membership and resource ownership. Never rely on client filtering. Do not log passwords, raw tokens, secrets, full account numbers, or unnecessary PII. Sentry is configured with default PII collection disabled.

These controls are a baseline, not a claim of certification or production readiness. Threat modelling, dependency scanning, penetration testing, key management, incident response, retention rules, and jurisdiction-specific compliance remain required before launch.
