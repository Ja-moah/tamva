# Security

Owns device trust, location observations, and security events — the
foundation behind "new device", "unusual location", and security-alert
product concepts. Every signal here has provenance: a concrete source
record it was derived from.

## Privacy

`Device.device_key` is an opaque identifier supplied by an authorized
client/integration, not a hardware fingerprint. No invasive fingerprinting
data is collected. `LocationObservation` only accepts location asserted by
a trusted source (provider transaction metadata, an authenticated client,
partner API metadata) with an explicit `confidence`; nothing is inferred
from weak signals, and there is no impossible-travel logic here.

## Provenance and idempotency

`DeviceObservation` and `LocationObservation` require `(provenance_type,
provenance_id)` referencing the concrete record the observation came from,
and are unique on it — replaying the same source event is a no-op, not a
duplicate. `CustomerDevice`/`Device` are live, upserted facts (mirroring
`domains.graph`'s `GraphEdge` design); `DeviceObservation` is the
append-only trail behind them.

## Signals

See `packages.contracts.signals` for the shared reason-code taxonomy this
domain, Feature Engine, Rules, and Risk all use. `record_security_event`
only ever fires for events with real evidence (a first-time device link, a
country change against a prior observation) — never speculatively.
