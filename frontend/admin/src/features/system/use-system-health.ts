import { useQuery } from "@tanstack/react-query";

import { getSystemHealth } from "../../lib/api";

export function useSystemHealth() {
  return useQuery({
    queryKey: ["system", "health"],
    queryFn: ({ signal }) => getSystemHealth(signal),
    retry: 2,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
