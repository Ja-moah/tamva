# Final security checklist

Status at the hardening review. "Test" names the automated check that keeps it true. Items marked
**open** need an operator decision or are deliberately out of scope for launch.

## Fixed during this review

| Weakness | Fix | Test |
| --- | --- | --- |
| Passport share checked consent only at creation; a revoked consent did not stop a recipient with the token | Consent is re-verified on every read and the denial is recorded | `tests/e2e/test_negative_paths.py`, `tests/integration/test_passport.py` |
| Cookie-session login had no throttle (brute force) | `auth` scope on `LoginView` | `tests/security/test_rate_limits.py` |
| Customer write endpoints unthrottled | Per-user `customer_write` limit; global user/anon backstops | `test_rate_limits.py` |
| Webhook URLs could target internal hosts (SSRF at delivery time) | Registration-time guard; `is_public_ip` for delivery-time re-check | `tests/security/test_outbound_urls.py` |
| Production accepted weak/placeholder secret, wildcard hosts, http origins, console email, local file storage | Startup validation with a full problem list | `tests/unit/test_production_settings.py` |
| Recovery email failures were swallowed | Logged without token/address | `tests/security/test_token_hardening.py` |
| Unhandled errors/404s could return HTML or stack traces | JSON envelope handlers | `tests/unit/test_observability.py` |
| Client-supplied `X-Request-ID` was echoed unvalidated | Shape-checked, else regenerated | `test_observability.py` |
| Health probes failed under `ALLOWED_HOSTS` | Probe sends an allowed Host | container smoke test |
| Test tooling shipped in the runtime image; build copied the whole repo | Multi-stage, source-only runtime | image inspection |
| Generated Admin `dist` was tracked in Git, and the container resolved an unpinned latest pnpm | `dist` untracked; `packageManager` pinned to the version the lockfile was made with | Admin build verifier (`verify:build`) |

## Verified (existing controls, now with tests)

- Tokens: opaque, ≥ 256-bit, SHA-256 at rest, 15 min / 30 day, rotation, reuse revokes the family,
  revocation on logout/reset/suspension, exclusive expiry boundary (`test_token_hardening.py`).
- Recovery tokens: single use, hashed, superseded by newer requests, expire, end all sessions.
- Sessions: login rotates the session key; CSRF required for cookie auth, not for bearer.
- CORS: exact origins only, no credentials, `null` and look-alike origins refused (`test_cors_and_headers.py`).
- Tenancy and ownership: cross-tenant, cross-customer, mass-assignment and IDOR cases in `tests/security/*`.
- Logs: no tokens, passwords or query strings.
- Container: non-root, read-only root filesystem, all capabilities dropped, `no-new-privileges`.

## Open / operator decisions

1. **DNS-rebinding on webhooks.** No webhook delivery exists yet; when it does, resolve, validate with
   `is_public_ip`, and connect to that IP.
2. **Email verification, MFA, push notifications, device management** are not built (deferred).
3. **Secret storage.** Env files on the host are the baseline; a secret manager is preferable.
4. **HSTS preload** stays off until the domain is final.
5. **Dependency pinning is by version, not hash** (`requirements.lock`); add `--require-hashes` and
   dependency/image scanning in CI when a registry and scanner are chosen.
6. **Backups are not configured** (see `BACKUP_AND_RESTORE.md`).
7. **API docs and Django admin are off in production**; enabling docs publicly is a product decision
   (see `KNOWN_LIMITATIONS.md`).
8. **Application IDs** (`com.tamva.app`) are placeholders until confirmed against an owned domain.
