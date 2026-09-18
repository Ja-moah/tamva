# Financial Confidence

A customer-facing, informational indicator — **not** a credit decision, a
lending approval, or `domains.risk`'s risk score, and not a simple
inversion of it. The two scores have deliberately different contracts:

| | Risk Score (`domains.risk`) | Financial Confidence |
| --- | --- | --- |
| Audience | Institutional | Customer-facing |
| Range | Decimal 0–1000 | Decimal 0–100 |
| Direction | Higher = higher risk | Higher = stronger verified financial confidence |
| Inputs | Rules + Model + policy | Profile completeness, account coverage, cashflow consistency, savings behaviour, transaction history depth |

`FinancialConfidencePolicyVersion.configuration` is a structured, validated
weighting of components and score bands (`policy.py`, no `eval()`),
following the same pattern as `domains.risk.policy`. Components with no
supporting data are marked `available=False` with an explicit reason —
never silently scored as zero — and the weighted score is renormalized
over only the available components; `completeness` records what fraction
of the total weight that represents, so a low-completeness score is
visibly less certain, not indistinguishable from a fully-observed one.

`FinancialConfidenceSnapshot` is immutable and versioned per
`(institution, customer, policy_version, source_fingerprint)`, mirroring
`domains.passport.PassportSnapshot`.
