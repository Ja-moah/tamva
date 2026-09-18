# Case

Owns alerts, investigations, assignments, evidence references, and the case
lifecycle. It consumes risk outputs without owning risk evaluation, and does
not rewrite historical `RiskEvent`s.

## Case-opening policy

Cases are not opened for every `RiskEvent`. `CaseOpeningPolicyVersion` holds a
structured, validated configuration (`policy.py`, no `eval()`) naming which
decisions (e.g. `BLOCK`, `HOLD`) or specific reason codes should open a case.
`services.create_reference_case_opening_policy_version()` seeds a
development/test default. Manual case creation bypasses this policy and is
attributed to an authorized operator (`created_by`).

## Lifecycle

```
OPEN -> TRIAGED -> INVESTIGATING -> ACTIONED -> RESOLVED
```

Transitions are validated against an explicit allow-list
(`services.ALLOWED_TRANSITIONS`); arbitrary status jumps are rejected.
Resolving a case requires an explicit `CaseResolution` and only succeeds from
`ACTIONED`.

## Assignment and notes

Assignment is tenant-safe: an assignee must hold an active
`InstitutionMembership` at the case's institution. Every assignment (and
reassignment) appends a `CaseAssignment` row rather than mutating history.
`CaseNote` and `CaseAction` are append-only operational records.

## Out of scope here

Frontend queues, mobile screens, notification delivery, the trust graph, and
the financial passport are not implemented in this domain.
