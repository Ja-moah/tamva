# Consent

Owns consent purposes, scopes, lifecycle, expiry, revocation, immutable consent
events, and purpose-scoped access decisions. A consent is granted by a customer
to one recipient institution for one institution-owned purpose and one or more
active scopes.

Consumers must call `domains.consent.services.check_consent_access` or
`require_consent_access` with trusted customer and institution identifiers plus
the required purpose and scope. Frontend state, request-provided tenant filters,
and the existence of a customer record are not consent decisions.

The module records consent lifecycle events separately from the shared audit
trail. Consent events are immutable history; revocation and expiry create new
events rather than rewriting earlier events. The module does not own customer
identity, recipient institutions, financial data, connector execution, ledger
classification, profile calculations, or risk rules.
