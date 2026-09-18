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
| Explainable risk | New signals flow through versioned Rules → Risk with stable reason codes (`DEVICE_NEW`, `COUNTERPARTY_FIRST_SEEN`, …), into case notification context. |

## Foundation ready

| Capability | What exists | What is missing |
| --- | --- | --- |
| Device signals | `Device`/`CustomerDevice`/`DeviceObservation`, trust states, `new_device_flag` feature, `NEW_DEVICE` security event. Opaque, institution-scoped identifiers only — no fingerprinting. | An authorized client/integration endpoint that reports device identifiers. |
| Location signals | `LocationObservation` (trusted source + confidence + provenance required), `new_location_flag`, `UNUSUAL_LOCATION` security event on country change. | A trusted source (provider metadata / authenticated client) actually supplying location. No impossible-travel logic. |
| Security events | `SecurityEvent` log with category, severity, provenance, sanitized metadata. | Producers for authentication-failure / credential / consent-security events; an API surface for the Security Center. |

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
