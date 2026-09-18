"""Backend capability manifest, so clients render what actually exists
instead of guessing. States describe *product* availability only — never
implementation detail.

    AVAILABLE      implemented and fed by trusted data paths
    PARTIAL        implemented, but not every input path is wired yet
    NOT_AVAILABLE  not implemented (see docs/product/INTELLIGENCE_CAPABILITIES.md)
    DISABLED       implemented but switched off by configuration
"""

from enum import StrEnum


class CapabilityState(StrEnum):
    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    NOT_AVAILABLE = "NOT_AVAILABLE"
    DISABLED = "DISABLED"


CAPABILITIES: dict[str, CapabilityState] = {
    "financial_confidence": CapabilityState.AVAILABLE,
    "counterparty_intelligence": CapabilityState.AVAILABLE,
    "velocity_features": CapabilityState.AVAILABLE,
    "risk_explanations": CapabilityState.AVAILABLE,
    "financial_passport": CapabilityState.AVAILABLE,
    # Service layer + Feature Engine signals exist, but no client/integration
    # ingestion endpoint feeds them yet.
    "device_signals": CapabilityState.PARTIAL,
    "location_signals": CapabilityState.PARTIAL,
    "security_events": CapabilityState.PARTIAL,
    "dark_web_monitoring": CapabilityState.NOT_AVAILABLE,
    "external_breach_monitoring": CapabilityState.NOT_AVAILABLE,
    "cross_institution_graph": CapabilityState.NOT_AVAILABLE,
    "merchant_intelligence": CapabilityState.NOT_AVAILABLE,
    "account_takeover_detection": CapabilityState.NOT_AVAILABLE,
}
