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
    # POST /security/observations/ -> observe_* -> feature flags -> rules -> risk
    "device_signals": CapabilityState.AVAILABLE,
    "location_signals": CapabilityState.AVAILABLE,
    # Only NEW_DEVICE / UNUSUAL_LOCATION have producers, and there is no read
    # API for a Security Center yet.
    "security_events": CapabilityState.PARTIAL,
    "dark_web_monitoring": CapabilityState.NOT_AVAILABLE,
    "external_breach_monitoring": CapabilityState.NOT_AVAILABLE,
    "cross_institution_graph": CapabilityState.NOT_AVAILABLE,
    "merchant_intelligence": CapabilityState.NOT_AVAILABLE,
    "account_takeover_detection": CapabilityState.NOT_AVAILABLE,
    # Institutional operations surface (Admin).
    "admin_overview": CapabilityState.AVAILABLE,
    "customer_directory": CapabilityState.AVAILABLE,
    "trust_network": CapabilityState.AVAILABLE,
    "audit_trail": CapabilityState.AVAILABLE,
    "saved_views": CapabilityState.AVAILABLE,
    "data_export": CapabilityState.AVAILABLE,
    # Bulk is limited to case assign, case triage and notification mark-read.
    "bulk_operations": CapabilityState.PARTIAL,
    "team_management": CapabilityState.PARTIAL,
    "team_invitations": CapabilityState.NOT_AVAILABLE,
    # Credentials and webhooks are managed; request logs and usage metering are not.
    "partner_integrations": CapabilityState.PARTIAL,
    "api_usage_metrics": CapabilityState.NOT_AVAILABLE,
    # Nothing here is derived from data TAMVA records or licenses.
    "currency_conversion": CapabilityState.NOT_AVAILABLE,
    "fraud_prevented_value": CapabilityState.NOT_AVAILABLE,
    "institution_comparison": CapabilityState.NOT_AVAILABLE,
    "geographic_risk": CapabilityState.NOT_AVAILABLE,
    "quiet_hours": CapabilityState.NOT_AVAILABLE,
    "scheduled_reports": CapabilityState.NOT_AVAILABLE,
}
