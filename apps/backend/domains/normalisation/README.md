# Normalisation

Owns provider-to-canonical transformation, validation, deduplication contracts, and canonical transaction mapping. It does not own raw connections or the durable financial ledger.

`normalise_raw_event` accepts only connector events marked ready for normalisation. It creates one immutable-provenance `CanonicalTransaction` per raw event, or records a quarantine outcome when the provider record cannot be interpreted without guessing at financial meaning. Raw payloads remain owned by Connector and are never rewritten here.

