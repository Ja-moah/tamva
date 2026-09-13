import { useQuery } from "@tanstack/react-query";

import { getSystemHealth } from "../../lib/api";

export function useSystemHealth() {
  return useQuery({
    queryKey: ["system", "health"],
    queryFn: ({ signal }) => getSystemHealth(signal),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
