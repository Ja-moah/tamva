# Contributing

Never push feature work directly to `main`. Pull the latest `main` before substantial work and create a focused branch such as `feat/identity-session`, `feat/ledger-import`, `feat/risk-reasons`, `fix/...`, `docs/...`, or `refactor/...`.

Keep pull requests small and within the named domain. Do not include unrelated refactors. Add or update tests and documentation. Database migrations must be reviewed for locking, reversibility, constraints, and tenant impact. API and event contract changes must be explicit. Never commit credentials, tokens, `.env`, financial account data, or unnecessary PII.

Before opening a PR, run:

```bash
make check
make test
```

Complete the PR template and request review. At least one approval is required before merge; sensitive or cross-domain changes should be reviewed by every affected owner. Use `CODEOWNERS.example` as a template only after real GitHub teams exist.

