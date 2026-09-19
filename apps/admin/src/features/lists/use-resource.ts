import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResourceType } from "@tamva/client-contracts";

import { useToast } from "../../components/ui/toast";
import {
  createSavedView,
  deleteSavedView,
  downloadExport,
  getExport,
  getResourceCatalog,
  listSavedViews,
  requestExport,
  type ExportInput,
  type SavedViewInput,
} from "./api";

export function useResourceCatalog(resource: ResourceType) {
  return useQuery({
    queryKey: ["resources", "catalog"],
    queryFn: ({ signal }) => getResourceCatalog(signal),
    staleTime: 5 * 60_000,
    select: (catalog) => catalog.find((entry) => entry.resource_type === resource),
  });
}

export function useSavedViews(resource: ResourceType) {
  const queryClient = useQueryClient();
  const key = ["saved-views", resource];
  const views = useQuery({ queryKey: key, queryFn: ({ signal }) => listSavedViews(resource, signal) });
  const create = useMutation({
    mutationFn: (input: SavedViewInput) => createSavedView(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteSavedView(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  return { views, create, remove };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Request an export, wait for the worker, then download the finished file. */
export function useExport() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: ExportInput) => {
      let job = await requestExport(input);
      for (let attempt = 0; attempt < 60 && (job.status === "PENDING" || job.status === "RUNNING"); attempt++) {
        await sleep(1000);
        job = await getExport(job.id);
      }
      if (job.status !== "COMPLETED") {
        throw new Error(
          job.status === "FAILED"
            ? `The export failed (${job.error_code || "unknown reason"}).`
            : "The export is still being prepared. Try again shortly.",
        );
      }
      const { blob, filename } = await downloadExport(job.id);
      saveBlob(blob, filename ?? `tamva-export.${input.format.toLowerCase()}`);
      return job;
    },
    onSuccess: (job) =>
      toast({ title: "Export ready", description: `${job.row_count} rows downloaded.`, type: "success" }),
    onError: (error) =>
      toast({ title: "Export failed", description: error.message, type: "error" }),
  });
}
