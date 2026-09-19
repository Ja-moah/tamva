import { riskEventDetailSchema, riskEventPageSchema } from "@tamva/client-contracts";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "../../lib/api";

export const useRiskEvents = (query: Record<string, string | number>) =>
  useQuery({
    queryKey: ["risk-events", query],
    queryFn: ({ signal }) => apiRequest({ path: "/risk/events/", query, schema: riskEventPageSchema, signal }),
    placeholderData: keepPreviousData,
  });

export const useRiskEvent = (id: string | null) =>
  useQuery({
    queryKey: ["risk-events", "detail", id],
    queryFn: ({ signal }) => apiRequest({ path: `/risk/events/${id}/`, schema: riskEventDetailSchema, signal }),
    enabled: id !== null,
  });
