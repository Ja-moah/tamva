import { analyticsSchema, overviewSchema } from "@tamva/client-contracts";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../../lib/api";

export const useOverview = (days: number) =>
  useQuery({
    queryKey: ["overview", days],
    queryFn: ({ signal }) => apiRequest({ path: "/overview/", query: { days }, schema: overviewSchema, signal }),
    select: (envelope) => envelope.data,
    staleTime: 30_000,
  });

export const useAnalytics = (days: number) =>
  useQuery({
    queryKey: ["analytics", days],
    queryFn: ({ signal }) =>
      apiRequest({ path: "/analytics/summary/", query: { days }, schema: analyticsSchema, signal }),
    select: (envelope) => envelope.data,
    staleTime: 30_000,
  });
