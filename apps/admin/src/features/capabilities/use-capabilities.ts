import { useQuery } from "@tanstack/react-query";
import type { CapabilityState } from "@tamva/client-contracts";

import { getCapabilities } from "../../lib/api";

export function useCapabilities() {
  return useQuery({
    queryKey: ["capabilities"],
    queryFn: ({ signal }) => getCapabilities(signal),
    staleTime: 5 * 60_000,
  });
}

// Unknown or not-yet-loaded capabilities are treated as unavailable so a screen
// never presents live data the backend has not said it can serve.
export function useCapability(code: string): CapabilityState {
  const { data } = useCapabilities();
  return data?.[code] ?? "NOT_AVAILABLE";
}
