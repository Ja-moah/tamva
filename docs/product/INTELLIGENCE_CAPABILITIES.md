# Intelligence capabilities

What TAMVA's trust/risk intelligence actually does today, what has a real
foundation but is not fully fed yet, and what depends on things TAMVA does not
have. Clients should read `GET /api/v1/capabilities/` rather than guessing; that
endpoint reports the same classification at runtime.

- **IMPLEMENTED** — built, tested, fed by trusted data paths.
- **FOUNDATION_READY** — schema, service, and Feature Engine signals exist;
  an input path (usually client/integration ingestion) is not wired yet.
- **V2_EXTERNAL** — depends on external providers, invasive data, or
  governance decisions that have not been made. Not implemented; no
  detection is faked.

Every signal carries provenance (the concrete source record it came from) and
a stable machine-readable reason code (`packages/contracts/signals.py`), never
presentation text. Where data is insufficient, a feature is `available=false`
with an explicit reason — never silently zero.

## Implemented

| Capability | Notes |
| --- | --- |
| Financial Confidence | 0–100, higher = stronger verified financial confidence. Informational: **not** a credit decision, lending approval, or risk score (`domains/confidence`). Unavailable inputs lower `completeness` instead of scoring as zero. |
| Counterparty intelligence | First-seen / repeat / aggregate relationships derived only from canonical transactions (`domains/counterparty`). No external beneficiary reputation. |
| Velocity & behavioural features | `transactions_last_1h/24h`, `transaction_value_last_1h`, `unique_counterparties_30d`, typical amount / daily frequency baselines and deviations. Windows are measured back from the profile snapshot's `period_end`, so results are reproducible. |
| Device signals | `POST /api/v1/security/observations/` (type `DEVICE`) → `Device`/`CustomerDevice`/`DeviceObservation` → `NEW_DEVICE` event and `new_device_flag` feature → Rules → Risk. Opaque, institution-scoped identifiers only — no fingerprinting; the caller reports what it observed and never asserts trust or a verdict. |
| Location signals | Same endpoint (type `LOCATION`): country/region/city with an explicit confidence and source → `UNUSUAL_LOCATION` event and `new_location_flag`. No GPS coordinates, no impossible-travel logic. |
| Explainable risk | New signals flow through versioned Rules → Risk with stable reason codes (`DEVICE_NEW`, `COUNTERPARTY_FIRST_SEEN`, …), into case notification context. |

## Foundation ready

| Capability | What exists | What is missing |
| --- | --- | --- |
| Security events | `SecurityEvent` log with category, severity, provenance, sanitized metadata; producers for `NEW_DEVICE` and `UNUSUAL_LOCATION`. | Producers for authentication-failure / credential / consent-security / access-anomaly events, and a read API for the Security Center. |

### Observation intake contract

`POST /api/v1/security/observations/` requires an authenticated caller with
`security:observe` in the institution named by `X-Institution-ID`, an
existing relationship between the customer and that institution, and active
customer consent for purpose `security_monitoring` / scope `security:observe`.
Bodies are strictly typed (unknown fields are rejected), carry a
`source` and `source_event_id` (the idempotency key — replaying it is a
no-op returning `200`), and reject future timestamps. Denials return one
message regardless of cause and are audited. Rate limit:
`THROTTLE_RATE_SECURITY_OBSERVATION`.

## V2 / external

| Capability | Prerequisite |
| --- | --- |
| Dark-web monitoring | External breach/threat-intelligence feed and its legal/contractual basis. |
| External breach monitoring | Same. |
| Cross-institution shared graph | A governance, privacy, and legal framework; the current graph is deliberately institution-isolated. |
| Merchant intelligence | A real merchant identity/network data source (TAMVA has counterparty references only). |
| Production-grade account-takeover detection | Richer device/session telemetry plus trained models; today TAMVA only reports what its signals evidence and never claims takeover. |
| Third-party device fingerprinting | Vendor integration and a privacy review. |
| Fraud consortium data | Data-sharing agreements and governance. |

## Claims TAMVA must not make yet

- "Fraud prevented (GH¢…)": requires proving a threat was identified, an
  intervention occurred, and loss was actually avoided. Safe today: value
  *reviewed*, or value associated with blocked/held recommendations.
- Account takeover, malware, or compromised-device verdicts.
- Any location or device statement without a provenanced source observation.

## Institutional operations surface (Admin)

`GET /api/v1/capabilities/` also reports the operations features the Admin
depends on, so the UI renders what exists and nothing else.

| Capability | State | Meaning |
| --- | --- | --- |
| `admin_overview`, `customer_directory`, `trust_network`, `audit_trail`, `saved_views`, `data_export` | AVAILABLE | Built and tested. |
| `bulk_operations` | PARTIAL | Case assign, case triage and notification mark-read only. |
| `team_management` | PARTIAL | Roles and status; no invitations. |
| `partner_integrations` | PARTIAL | Credentials, webhooks (create) and connection health; no request logs. |
| `team_invitations`, `api_usage_metrics`, `quiet_hours`, `scheduled_reports` | NOT_AVAILABLE | Not built. |
| `currency_conversion` | NOT_AVAILABLE | No approved exchange-rate provider. A rate-snapshot foundation exists; nothing converts. |
| `fraud_prevented_value`, `institution_comparison`, `geographic_risk` | NOT_AVAILABLE | Not derivable from what TAMVA records; deliberately not reported. |
