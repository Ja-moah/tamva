"""Shared reason-code taxonomy for trust/risk signals.

Reason codes are plain strings by design (matching RuleDefinition.reason_code
and RiskReason.code elsewhere): they are stable, machine-readable identifiers
that Rules, Risk, Case, and Notifications already pass around as data, not a
new relationship to model. This module exists so every domain that emits or
consumes a code spells it the same way, not to introduce a new registry
table. Presentation text belongs to the client, never here.

A code is only ever emitted when a domain has real, provenanced evidence for
it. There is no guarantee every code here is currently produced anywhere —
see docs/product/INTELLIGENCE_CAPABILITIES.md for what is actually wired up.
"""

from enum import StrEnum


class SignalCategory(StrEnum):
    TRANSACTION = "TRANSACTION"
    BEHAVIOUR = "BEHAVIOUR"
    COUNTERPARTY = "COUNTERPARTY"
    DEVICE = "DEVICE"
    LOCATION = "LOCATION"
    IDENTITY = "IDENTITY"
    NETWORK = "NETWORK"
    ACCESS = "ACCESS"


# code -> category, kept as a flat mapping rather than per-domain enums so a
# rule/risk policy can validate a code against one shared source of truth.
REASON_CODES: dict[str, SignalCategory] = {
    "DEVICE_NEW": SignalCategory.DEVICE,
    "DEVICE_FIRST_SEEN": SignalCategory.DEVICE,
    "DEVICE_TRUSTED": SignalCategory.DEVICE,
    "DEVICE_SUSPICIOUS": SignalCategory.DEVICE,
    "DEVICE_BLOCKED": SignalCategory.DEVICE,
    "LOCATION_FIRST_SEEN": SignalCategory.LOCATION,
    "LOCATION_NEW_COUNTRY": SignalCategory.LOCATION,
    "LOCATION_NEW_REGION": SignalCategory.LOCATION,
    "LOCATION_CHANGE": SignalCategory.LOCATION,
    "COUNTERPARTY_FIRST_SEEN": SignalCategory.COUNTERPARTY,
    "COUNTERPARTY_LOW_HISTORY": SignalCategory.COUNTERPARTY,
    "COUNTERPARTY_FREQUENT": SignalCategory.COUNTERPARTY,
    "COUNTERPARTY_HIGH_CONCENTRATION": SignalCategory.COUNTERPARTY,
    "AMOUNT_DEVIATION_HIGH": SignalCategory.BEHAVIOUR,
    "VELOCITY_HIGH": SignalCategory.BEHAVIOUR,
    "AUTHENTICATION_FAILURE": SignalCategory.ACCESS,
    "UNUSUAL_LOCATION": SignalCategory.LOCATION,
    "CREDENTIAL_EVENT": SignalCategory.IDENTITY,
    "CONSENT_SECURITY_EVENT": SignalCategory.IDENTITY,
    "ACCOUNT_ACCESS_ANOMALY": SignalCategory.ACCESS,
}


def category_for(reason_code: str) -> SignalCategory | None:
    return REASON_CODES.get(reason_code)
