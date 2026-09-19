import {
  memberEnvelopeSchema,
  memberPageSchema,
  permissionsEnvelopeSchema,
  rolesEnvelopeSchema,
} from "@tamva/client-contracts";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "../../lib/api";

export const useMembers = (query: Record<string, string | number>) =>
  useQuery({
    queryKey: ["team", "members", query],
    queryFn: ({ signal }) => apiRequest({ path: "/team/members/", query, schema: memberPageSchema, signal }),
    placeholderData: keepPreviousData,
  });

export const useRoles = () =>
  useQuery({
    queryKey: ["team", "roles"],
    queryFn: ({ signal }) => apiRequest({ path: "/team/roles/", schema: rolesEnvelopeSchema, signal }),
    select: (e) => e.data,
    staleTime: 5 * 60_000,
  });

export const usePermissions = () =>
  useQuery({
    queryKey: ["team", "permissions"],
    queryFn: ({ signal }) => apiRequest({ path: "/team/permissions/", schema: permissionsEnvelopeSchema, signal }),
    select: (e) => e.data,
    staleTime: 5 * 60_000,
  });

export function useMemberChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; roles?: string[]; status?: string }) =>
      apiRequest({
        method: "POST",
        path: `/team/members/${input.id}/${input.roles ? "roles" : "status"}/`,
        body: input.roles ? { roles: input.roles } : { status: input.status },
        schema: memberEnvelopeSchema,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team"] }),
  });
}
