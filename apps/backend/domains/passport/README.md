# Passport

Owns financial-passport assembly, controlled sharing, expiry, and revocation.
Access always depends on tenant authorization and valid consent.

## Snapshot design

`PassportSnapshot` is immutable and versioned per
`(passport, schema_version, source_fingerprint)`, where the fingerprint
covers the financial profile snapshot, feature run, risk event, and graph
run it was built from. Regenerating from unchanged sources returns the same
snapshot; any new upstream fact produces a new one. Old snapshots — and any
shares built on them — are never rewritten.

Each `PassportSection` is its own versioned row (`schema_version` +
`payload`) rather than one nested JSON blob, so a share can grant exactly
the sections a recipient needs.

## Data minimization

Only aggregate, already-approved TAMVA outputs are ever included — financial
profile summaries, selected feature availability/confidence, a coarse risk
band with a reason *count* (never the reason codes or model internals), and
selected graph metrics (never counterparty names or edges). Raw ledger
transactions and account balances are never part of any section.

## Sharing and consent

Sharing does not invent a second consent system: `create_passport_share`
calls `domains.consent.services.require_consent_access` and requires the
customer to have an active `Consent` granted directly to the **recipient**
institution for the share's `purpose_code` and the `passport:read` scope.
Share tokens are opaque (`secrets.token_urlsafe`); only their SHA-256 hash is
persisted, never the plaintext.

## Access and revocation

`access_passport_share` validates, in order: token exists, not revoked, not
expired (lazily transitioned to `EXPIRED` on first late access), correct
recipient institution, and requested sections within the granted scope.
Every denial is recorded as a `PassportShareAccess` (outcome `DENIED`, with
a reason) and audited, even though the call itself raises
`PermissionDenied` — the audit trail is deliberately not rolled back with
the failed request.

Revocation is a simple, irreversible `PassportShare.status` transition
(`ACTIVE`/`EXPIRED` -> `REVOKED`) authorized only by the passport's home
institution; a dedicated lifecycle-event table was judged unnecessary
on top of `PassportShareAccess` plus the existing audit infrastructure.

## Out of scope here

Admin UI, mobile UI, a public marketing page, QR-code UI, blockchain
credentials, and external identity standards are not implemented in this
domain.
