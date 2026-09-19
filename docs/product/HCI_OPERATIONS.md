# HCI for operations

What every operational screen provides, and the rules behind it.

## Screen states

Every data screen renders all of: **loading**, **empty** (with a next step),
**error** (with request id and retry), **unauthorized** (403 or missing
permission), and **partial-capability** (an explicit note of what is missing) via
the shared `QueryBoundary`, `UnauthorizedState`, `UnavailableState` and
`CapabilityGate`. Capability comes from `GET /capabilities/`; anything the
backend doesn't list is treated as unavailable.

## Lists

| Capability | Where |
| --- | --- |
| Search, filters, server-side sorting, pagination (10/25/50/100) | Risk events, Cases, Customers, Notifications, Security, Audit, Team, Network, Connections |
| Filter controls generated from `GET /resources/` | Risk, Cases, Customers, Notifications, Security events, Audit |
| Saved views (private; filters + ordering + visible columns) | Same resources |
| Column visibility | Risk, Cases, Customers, Notifications, Security events |
| Row selection | Risk, Cases, Customers, Notifications |
| Bulk actions | Cases (triage, assign to me), Notifications (mark read) |
| Export (CSV / XLSX, filtered or selected rows) | Resources the actor may read and `export:manage` |

Changing filters, search, ordering or page size returns to page 1. A stale page
stays visible (dimmed, `aria-busy`) while the next one loads.

## Sensitive actions

Case transitions, assignment, resolution, bulk changes, role/status changes,
credential rotation/revocation and secret issuance all use `ActionDialog`: the
action is named, a reason is required where the backend requires one (case
resolution), backend validation errors are shown in the dialog, success is
announced by toast, and focus returns to the control that opened it. Destructive
actions use the danger style.

## Accessibility

- Tables have captions, `scope` headers and `aria-sort`; sort buttons announce their state.
- Rows are keyboard-operable (Enter/Space); checkboxes carry row-specific labels.
- Dialogs and drawers are `role="dialog"` with `aria-modal`, labelled titles, Escape to close and focus restore; dialogs trap Tab.
- Status is never colour-only: badges carry text.
- Charts have `role="img"` and a text label; the same figures are available as lists.
- Loading and empty states use `role="status"`; errors use `role="alert"`.
- The bell announces its unread count.

Not yet done: a full screen-reader pass, a focus trap inside the detail drawer
(it restores focus but does not trap), and automated axe checks in CI.

## Exports — semantics people should know

- The file is generated on the server from the same filters the list uses; it is not a screenshot of the current page.
- Customer exports contain the masked email only.
- A job that would exceed 50 000 rows fails visibly; it is never silently truncated.
- Without a running Celery worker, jobs stay pending and the UI reports that the export is still being prepared.

## International

Dates and numbers use `Intl` with the institution's locale and time zone (from
`/institution/locale/`, Ghana-first defaults flagged `is_default`). Money is shown
in each record's own currency and is never converted or summed across currencies.
No screen contains a hard-coded currency symbol, country or time zone.
