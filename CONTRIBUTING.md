# Contributing

## Branch model

TAMVA uses a two-tier shared branch model:

```text
main
  ↑
tamva
  ↑
feature branches
```

- `main` is stable, accepted release history.
- `tamva` is the shared integration and acceptance branch.
- Feature branches are created from `tamva` and merged back into `tamva` by pull request.
- Release pull requests promote tested integrated work from `tamva` to `main`.
- Do not create or use a `develop` branch.

Nobody should develop, commit feature work, or push directly on `main` or `tamva`. Both shared branches should be protected in GitHub and require pull-request review and passing CI.

## Starting work

Update the local integration branch before creating a feature branch:

```bash
git checkout tamva
git pull origin tamva
git checkout -b feat/<feature-name>
```

Recommended branch names include:

- `feat/identity-auth`
- `feat/ledger-engine`
- `feat/risk-engine`
- `fix/<short-description>`
- `docs/<short-description>`
- `refactor/<short-description>`

Keep changes focused within the owning domain. Do not include unrelated refactors or bypass a domain's public interfaces. New cross-domain dependencies require an explicit contract and architecture review.

The repository has one operational web client in `apps/admin/` and one
customer client in `apps/mobile/`. The customer client is a single Expo/React Native
codebase for Android, iOS, and Web; do not create a separate customer web
workspace. Backend modules in `apps/backend/domains/`, shared Python packages in
`apps/backend/packages/`, and Django configuration in `apps/backend/config/`
remain the authority for business rules and access decisions.

## Validating and submitting work

Before committing, run:

```bash
make check
make test
```

Then publish the feature branch:

```bash
git add .
git commit -m "feat(domain): short description"
git push -u origin feat/<feature-name>
```

Open the pull request with this direction:

```text
feat/<feature-name> → tamva
```

Complete the pull-request template and obtain review before merge. At least one approval is required; sensitive or cross-domain changes should be reviewed by every affected owner.

When a tested set of features is ready for release, open a separate pull request:

```text
tamva → main
```

Do not merge an untested feature branch directly into `main`.

## Change requirements

- Add or update tests and documentation.
- Review migrations for locking, reversibility, constraints, and tenant impact.
- Identify API and event contract changes explicitly.
- Do not commit credentials, tokens, `.env`, financial account data, or unnecessary PII.
- Do not hard-code institution-specific behavior.
- Use `CODEOWNERS.example` only as a template until real GitHub teams are assigned.

## AI-assisted changes

Before an AI agent touches code, instruct it to read `AGENTS.md`, `AI_GOVERNANCE.md`, the assigned domain skill, relevant ADRs, and the relevant domain README. `AGENTS.md` and `AI_GOVERNANCE.md` are currently pending and must not be silently invented as part of unrelated feature work.
