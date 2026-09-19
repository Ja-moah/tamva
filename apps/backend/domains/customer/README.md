# Customer

Customer-facing read models and actions for the mobile/web customer app. It owns
no business data: every figure is read from, and every action is performed by,
the authoritative domain (`profile`, `confidence`, `normalisation`, `connector`,
`consent`, `passport`, `security`, `notifications`). This app only scopes them to
*the signed-in customer* and shapes them for presentation.

Rules that hold for every endpoint here:

- the caller must be an active `CUSTOMER` identity (`IsCustomerActor`); institution
  staff are refused, and no `InstitutionMembership` is needed or consulted;
- every queryset is filtered by `customer=request.user`, so another customer's
  object is a 404, never a 403 that would confirm it exists;
- responses are minimised: no provider credentials, raw payloads, source event
  ids, model/rule internals or other tenants' metadata;
- Financial Confidence (0–100, higher = stronger verified confidence) and Risk
  Score (0–1000, institutional) are never mixed or inverted; Risk Score is not
  exposed here at all.
