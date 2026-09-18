# Modeling

Owns the versioned model-evaluation interface: model definitions, model
versions, feature bindings, and evaluation runs/results. It produces model
evidence only.

This domain does not decide ALLOW/CHALLENGE/HOLD/BLOCK, does not own rules or
risk policy, and does not couple TAMVA to any specific ML framework or vendor.
Execution goes through the `ModelProvider` interface in `providers.py`; the
only provider shipped here is `DeterministicMockModelProvider`, a
development/reference provider that is explicitly not a trained production
model.
