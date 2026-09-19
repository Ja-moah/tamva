import { customerDetailSchema, customerPageSchema } from "@tamva/client-contracts";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "../../lib/api";

export const useCustomers = (query: Record<string, string | number>) =>
  useQuery({
    queryKey: ["customers", "list", query],
    queryFn: ({ signal }) => apiRequest({ path: "/customers/", query, schema: customerPageSchema, signal }),
    placeholderData: keepPreviousData,
  });

export const useCustomer = (id: string | null) =>
  useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: ({ signal }) => apiRequest({ path: `/customers/${id}/`, schema: customerDetailSchema, signal }),
    select: (envelope) => envelope.data,
    enabled: id !== null,
  });
