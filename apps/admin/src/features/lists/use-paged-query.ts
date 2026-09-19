import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { z } from "zod";

import { apiRequest } from "../../lib/api";

/** One paginated, filterable list endpoint as a query; keeps the old page while the next loads. */
export function usePagedQuery<S extends z.ZodType>(
  key: string,
  path: string,
  schema: S,
  query: Record<string, string | number>,
  enabled = true,
) {
  return useQuery({
    queryKey: [key, "list", query],
    queryFn: ({ signal }) => apiRequest({ path, query, schema, signal }) as Promise<z.infer<S>>,
    placeholderData: keepPreviousData,
    enabled,
  });
}
