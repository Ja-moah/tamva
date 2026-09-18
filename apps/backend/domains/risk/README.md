# Risk

Owns risk-evaluation orchestration, risk events, decisions, and reason codes.
Inputs arrive through explicit feature/rule/model contracts; no fake ML is
included in the foundation.

This is TAMVA's first ALLOW/CHALLENGE/HOLD/BLOCK decision layer. It combines
evidence from Rules (`domains.rules`) and Model Interface (`domains.modeling`)
under a versioned, structured `RiskPolicyVersion`. Policy configuration is
data only — no expressions, no `eval()` — and is validated by
`policy.RiskPolicyConfig` before it can be saved.

## Risk score contract

`RiskEvent.score` is a `Decimal` in `[0, 1000]`, where **higher means higher
risk**. Model outputs are normalized into this space using the model
definition's own documented `score_direction`, so a "higher is safer" model
is never silently treated as "higher is safer means low risk" — it is
explicitly inverted before it reaches policy evaluation.

## Reference policy

`services.create_reference_policy_version()` seeds a deterministic
development/test policy (`policy.DEFAULT_CONFIGURATION`) demonstrating:

- hard-rule override (CRITICAL severity -> BLOCK, HIGH severity -> HOLD)
- model-score bands -> ALLOW / CHALLENGE / HOLD / BLOCK
- explicit behaviour when rules, model output, or profile completeness are
  missing (never silently treated as safe)

These thresholds are for development and tests only and are not a validated
lending or fraud policy.

## Out of scope here

Case management, notifications, the trust graph, and the financial passport
all consume risk output later and are not implemented in this domain.
