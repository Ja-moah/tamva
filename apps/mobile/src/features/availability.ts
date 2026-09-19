import type { CapabilityState } from '@tamva/client-contracts';

/** What a screen may render, given a capability and whether the app has wired it. */
export function resolveAvailability(
  state: CapabilityState,
  wired: boolean
): 'live' | 'partial' | 'unavailable' {
  if (!wired) return 'unavailable';
  if (state === 'AVAILABLE') return 'live';
  if (state === 'PARTIAL') return 'partial';
  return 'unavailable';
}
