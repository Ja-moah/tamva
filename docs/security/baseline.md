# Security baseline

Configuration comes from the environment and production refuses the development secret. Allowed hosts, CORS, CSRF trust, HTTPS redirect, trusted-proxy behavior, secure cookies, and HSTS are explicit settings. Django password validators are enabled. DRF uses authenticated access by default, with public endpoints opted in individually. Sensitive endpoints (auth, credential operations, connector sync, risk evaluation, passport share access) carry a `ScopedRateThrottle` scope; rates are environment configuration in `config/settings/base.py`, not hardcoded. Logs carry correlation metadata (`request_id`, `tenant_id`, `user_id` — the latter two populated post-authentication by `TenantContextMiddleware`) but must exclude credentials, raw tokens, full account numbers, and unnecessary PII.

Before production, complete a threat model, configure a secret manager and rotation, add dependency and container scanning, test tenant isolation, establish backup/restore and incident runbooks, and arrange independent security assessment.

