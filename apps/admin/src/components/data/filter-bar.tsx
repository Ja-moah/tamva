import type { ResourceType } from "@tamva/client-contracts";
import { Bookmark, Columns3, Download, Filter, Search, Trash2, X } from "lucide-react";
import { useId, useState } from "react";

import { useSession } from "../../features/session/use-session";
import { toSavedFilters, type ListController } from "../../features/lists/use-list-state";
import { useExport, useResourceCatalog, useSavedViews } from "../../features/lists/use-resource";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

const label = (param: string) => param.replace(/_/g, " ");

export interface ColumnOption {
  key: string;
  label: string;
}

const control =
  "h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-xs text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]";

interface FilterBarProps {
  resource: ResourceType;
  list: ListController;
  /** Table columns the user may hide. */
  columns: ColumnOption[];
  selectedIds?: string[];
  /** Extra controls (e.g. bulk actions) rendered at the end of the bar. */
  children?: React.ReactNode;
  allowExport?: boolean;
}

export function FilterBar({ resource, list, columns, selectedIds = [], children, allowExport = true }: FilterBarProps) {
  const id = useId();
  const { can } = useSession();
  const { toast } = useToast();
  const catalog = useResourceCatalog(resource);
  const { views, create, remove } = useSavedViews(resource);
  const exporter = useExport();
  const [panel, setPanel] = useState<"filters" | "columns" | "views" | "export" | null>(null);
  const [viewName, setViewName] = useState("");
  const { state } = list;

  const filters = (catalog.data?.filters ?? []).filter((spec) => !spec.description.startsWith("Alias of"));
  const activeFilters = Object.values(state.filters).filter(Boolean).length + (state.search ? 1 : 0);
  const toggle = (name: NonNullable<typeof panel>) => setPanel((current) => (current === name ? null : name));

  const saveView = () => {
    const name = viewName.trim();
    if (!name) return;
    create.mutate(
      {
        resource_type: resource,
        name,
        filters: toSavedFilters(state),
        ordering: state.ordering,
        visible_columns: state.hidden.length
          ? columns.map((c) => c.key).filter((key) => !state.hidden.includes(key))
          : [],
      },
      {
        onSuccess: () => {
          setViewName("");
          toast({ title: "View saved", description: name, type: "success" });
        },
        onError: (error) => toast({ title: "Couldn't save view", description: error.message, type: "error" }),
      },
    );
  };

  const applyView = (viewId: string) => {
    const view = views.data?.find((v) => v.id === viewId);
    if (!view) return;
    const { search = "", ...rest } = view.filters;
    list.replace({
      filters: rest,
      search,
      ordering: view.ordering,
      hidden: view.visible_columns.length
        ? columns.map((c) => c.key).filter((key) => !view.visible_columns.includes(key))
        : [],
    });
    setPanel(null);
  };

  const runExport = (format: "CSV" | "XLSX", scope: "filtered" | "selected") => {
    exporter.mutate({
      resource_type: resource,
      format,
      filters: toSavedFilters(state),
      ordering: state.ordering,
      columns: [],
      selected_ids: scope === "selected" ? selectedIds : [],
    });
    setPanel(null);
  };

  return (
    <div className="mb-3 space-y-2" role="search" aria-label="Filter, save and export this list">
      <div className="flex flex-wrap items-center gap-2">
        {catalog.data?.search.length ? (
          <label className="relative">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-2 top-2 size-3.5 text-[var(--text-muted)]" aria-hidden />
            <input
              type="search"
              value={state.search}
              onChange={(event) => list.setSearch(event.target.value)}
              placeholder="Search…"
              className={`${control} w-56 pl-7`}
            />
          </label>
        ) : null}
        <Button size="sm" variant="secondary" aria-expanded={panel === "filters"} aria-controls={`${id}-filters`} onClick={() => toggle("filters")}>
          <Filter className="size-3.5" aria-hidden /> Filters{activeFilters ? ` (${activeFilters})` : ""}
        </Button>
        <Button size="sm" variant="secondary" aria-expanded={panel === "views"} aria-controls={`${id}-views`} onClick={() => toggle("views")}>
          <Bookmark className="size-3.5" aria-hidden /> Views
        </Button>
        {columns.length ? (
          <Button size="sm" variant="secondary" aria-expanded={panel === "columns"} aria-controls={`${id}-columns`} onClick={() => toggle("columns")}>
            <Columns3 className="size-3.5" aria-hidden /> Columns
          </Button>
        ) : null}
        {allowExport && can("export:manage") ? (
          <Button size="sm" variant="secondary" aria-expanded={panel === "export"} aria-controls={`${id}-export`} loading={exporter.isPending} onClick={() => toggle("export")}>
            <Download className="size-3.5" aria-hidden /> Export
          </Button>
        ) : null}
        {activeFilters || state.ordering ? (
          <Button size="sm" variant="ghost" onClick={list.reset}>
            <X className="size-3.5" aria-hidden /> Reset
          </Button>
        ) : null}
        {children}
      </div>

      {panel === "filters" ? (
        <div id={`${id}-filters`} className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-3 sm:grid-cols-2 lg:grid-cols-4">
          {filters.map((spec) => {
            const inputId = `${id}-f-${spec.param}`;
            const value = state.filters[spec.param] ?? "";
            const common = { id: inputId, value, className: `${control} w-full` };
            return (
              <div key={spec.param} className="flex flex-col gap-1">
                <label htmlFor={inputId} className="font-mono text-[10px] font-bold uppercase text-[var(--text-muted)]">
                  {label(spec.param)}
                </label>
                {spec.kind === "choice" || spec.kind === "bool" ? (
                  <select {...common} onChange={(event) => list.setFilter(spec.param, event.target.value)}>
                    <option value="">Any</option>
                    {(spec.kind === "bool" ? ["true", "false"] : spec.choices).map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...common}
                    type={spec.kind === "date" || spec.kind === "datetime" ? "date" : spec.kind === "decimal" || spec.kind === "int" ? "number" : "text"}
                    onChange={(event) => list.setFilter(spec.param, event.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {panel === "views" ? (
        <div id={`${id}-views`} className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-3">
          {views.data?.length ? (
            <ul className="space-y-1">
              {views.data.map((view) => (
                <li key={view.id} className="flex items-center justify-between gap-2">
                  <button type="button" onClick={() => applyView(view.id)} className="cursor-pointer text-xs font-semibold text-[var(--text-primary)] hover:underline">
                    {view.name}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete view ${view.name}`}
                    onClick={() => remove.mutate(view.id)}
                    className="cursor-pointer rounded p-1 text-[var(--text-muted)] hover:text-[var(--risk-high-text)]"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--text-secondary)]">No saved views yet. Set filters, then save them here.</p>
          )}
          <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] pt-2">
            <label className="sr-only" htmlFor={`${id}-view-name`}>
              View name
            </label>
            <input id={`${id}-view-name`} value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="Name this view" maxLength={100} className={`${control} flex-1`} />
            <Button size="sm" variant="primary" disabled={!viewName.trim()} loading={create.isPending} onClick={saveView}>
              Save current
            </Button>
          </div>
        </div>
      ) : null}

      {panel === "columns" ? (
        <fieldset id={`${id}-columns`} className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-3">
          <legend className="sr-only">Visible columns</legend>
          {columns.map((column) => (
            <label key={column.key} className="flex cursor-pointer items-center gap-1.5 text-xs">
              <input type="checkbox" checked={!state.hidden.includes(column.key)} onChange={() => list.toggleColumn(column.key)} className="accent-[var(--accent-emerald)]" />
              {column.label}
            </label>
          ))}
        </fieldset>
      ) : null}

      {panel === "export" ? (
        <div id={`${id}-export`} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-3 text-xs">
          <span className="text-[var(--text-secondary)]">Export current filters as</span>
          <Button size="sm" variant="secondary" onClick={() => runExport("CSV", "filtered")}>CSV</Button>
          <Button size="sm" variant="secondary" onClick={() => runExport("XLSX", "filtered")}>XLSX</Button>
          {selectedIds.length ? (
            <>
              <span className="text-[var(--text-secondary)]">or the {selectedIds.length} selected as</span>
              <Button size="sm" variant="secondary" onClick={() => runExport("CSV", "selected")}>CSV</Button>
              <Button size="sm" variant="secondary" onClick={() => runExport("XLSX", "selected")}>XLSX</Button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
