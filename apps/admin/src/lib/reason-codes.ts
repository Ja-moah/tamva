import { humanize } from "./format";

/**
 * The backend sends stable machine codes only (by design). This dictionary is
 * presentation text for the codes it currently emits; unknown codes fall back
 * to a readable form of the code itself, never to invented explanations.
 */
const REASONS: Record<string, string> = {
  DEVICE_NEW: "Activity from a device not seen before for this customer",
  DEVICE_FIRST_SEEN: "First time this device has been observed",
  DEVICE_BLOCKED: "Device is marked blocked",
  DEVICE_SUSPICIOUS: "Device is marked suspicious",
  DEVICE_TRUSTED: "Device is marked trusted",
  LOCATION_NEW_COUNTRY: "Activity from a country not seen before",
  LOCATION_NEW_REGION: "Activity from a region not seen before",
  LOCATION_FIRST_SEEN: "First time this location has been observed",
  LOCATION_CHANGE: "Location differs from the customer's usual pattern",
  COUNTERPARTY_FIRST_SEEN: "First transaction with this counterparty",
  COUNTERPARTY_FREQUENT: "Frequent, established counterparty",
  COUNTERPARTY_LOW_HISTORY: "Counterparty has very little history",
  COUNTERPARTY_HIGH_CONCENTRATION: "Activity concentrated on very few counterparties",
  AMOUNT_DEVIATION_HIGH: "Amount is far from this customer's typical amount",
  LOW_PROFILE_COMPLETENESS: "Not enough verified data to judge this customer confidently",
  INSUFFICIENT_EVIDENCE: "Insufficient evidence to reach a stronger decision",
  MODEL_HIGH_RISK: "Model assessed high risk",
  MODEL_MODERATE_RISK: "Model assessed moderate risk",
  MODEL_LOW_RISK: "Model assessed low risk",
  MODEL_UNAVAILABLE: "Model was unavailable for this evaluation",
};

export const reasonText = (code: string): string => REASONS[code] ?? humanize(code);
