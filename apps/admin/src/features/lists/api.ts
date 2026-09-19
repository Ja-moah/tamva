import {
  downloadLinkSchema,
  exportJobEnvelopeSchema,
  exportJobSchema,
  resourceCatalogSchema,
  savedViewPageSchema,
  savedViewSchema,
  type ExportJob,
  type ResourceType,
  type SavedView,
} from "@tamva/client-contracts";

import { apiBlob, apiRequest } from "../../lib/api";

export async function getResourceCatalog(signal?: AbortSignal) {
  return (await apiRequest({ path: "/resources/", schema: resourceCatalogSchema, signal })).data;
}

export async function listSavedViews(resourceType: ResourceType, signal?: AbortSignal) {
  return (
    await apiRequest({
      path: "/saved-views/",
      query: { resource_type: resourceType, page_size: 100 },
      schema: savedViewPageSchema,
      signal,
    })
  ).results;
}

export interface SavedViewInput {
  resource_type: ResourceType;
  name: string;
  filters: Record<string, string>;
  ordering: string;
  visible_columns: string[];
}

export function createSavedView(input: SavedViewInput): Promise<SavedView> {
  return apiRequest({ method: "POST", path: "/saved-views/", body: input, schema: savedViewSchema });
}

export async function deleteSavedView(id: string): Promise<void> {
  await apiRequest({ method: "DELETE", path: `/saved-views/${id}/` });
}

export interface ExportInput {
  resource_type: ResourceType;
  format: "CSV" | "XLSX";
  filters: Record<string, string>;
  ordering: string;
  columns: string[];
  selected_ids: string[];
}

export async function requestExport(input: ExportInput): Promise<ExportJob> {
  return (
    await apiRequest({ method: "POST", path: "/exports/", body: input, schema: exportJobEnvelopeSchema })
  ).data;
}

export async function getExport(id: string, signal?: AbortSignal): Promise<ExportJob> {
  return apiRequest({ path: `/exports/${id}/`, schema: exportJobSchema, signal });
}

export async function downloadExport(id: string): Promise<{ blob: Blob; filename: string | null }> {
  const link = (
    await apiRequest({ method: "POST", path: `/exports/${id}/download-link/`, schema: downloadLinkSchema })
  ).data;
  return apiBlob(`/exports/${id}/download/`, { token: link.token });
}
