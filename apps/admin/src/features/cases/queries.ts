import {
  bulkResultSchema,
  caseDetailEnvelopeSchema,
  casePageSchema,
  type BulkResult,
} from "@tamva/client-contracts";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "../../lib/api";

export const useCases = (query: Record<string, string | number>) =>
  useQuery({
    queryKey: ["cases", "list", query],
    queryFn: ({ signal }) => apiRequest({ path: "/cases/", query, schema: casePageSchema, signal }),
    placeholderData: keepPreviousData,
  });

export const useCase = (id: string | null) =>
  useQuery({
    queryKey: ["cases", "detail", id],
    queryFn: ({ signal }) => apiRequest({ path: `/cases/${id}/`, schema: caseDetailEnvelopeSchema, signal }),
    select: (envelope) => envelope.data,
    enabled: id !== null,
  });

type Action =
  | { kind: "transition"; id: string; new_status: string; note: string }
  | { kind: "assign"; id: string; assignee_id: string | null; note: string }
  | { kind: "note"; id: string; body: string }
  | { kind: "resolve"; id: string; outcome: string; reason: string };

/** Single-case workflow actions. The backend validates every transition. */
export function useCaseAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: Action) => {
      const base = `/cases/${action.id}`;
      if (action.kind === "transition")
        return apiRequest({ method: "POST", path: `${base}/transition/`, body: { new_status: action.new_status, note: action.note } });
      if (action.kind === "assign")
        return apiRequest({ method: "POST", path: `${base}/assign/`, body: { assignee_id: action.assignee_id, note: action.note } });
      if (action.kind === "note") return apiRequest({ method: "POST", path: `${base}/notes/`, body: { body: action.body } });
      return apiRequest({ method: "POST", path: `${base}/resolve/`, body: { outcome: action.outcome, reason: action.reason } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases"] }),
  });
}

export function useBulkCaseAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { kind: "assign" | "triage"; case_ids: string[]; assignee_id?: string | null; note: string }): Promise<BulkResult> => {
      const body =
        input.kind === "assign"
          ? { case_ids: input.case_ids, assignee_id: input.assignee_id ?? null, note: input.note }
          : { case_ids: input.case_ids, note: input.note };
      const result = await apiRequest({
        method: "POST",
        path: `/cases/bulk-${input.kind}/`,
        body,
        schema: bulkResultSchema,
        idempotencyKey: crypto.randomUUID(),
      });
      return result.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cases"] }),
  });
}
