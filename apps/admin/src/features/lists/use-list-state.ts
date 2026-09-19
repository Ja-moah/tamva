import { useCallback, useMemo, useState } from "react";

export interface ListState {
  page: number;
  pageSize: number;
  ordering: string;
  search: string;
  filters: Record<string, string>;
  /** Table columns hidden by the user; empty means all visible. */
  hidden: string[];
}

const DEFAULT_PAGE_SIZE = 25;

export function initialListState(overrides: Partial<ListState> = {}): ListState {
  return {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    ordering: "",
    search: "",
    filters: {},
    hidden: [],
    ...overrides,
  };
}

/** Query-string params for a list endpoint. Empty values are omitted. */
export function toQuery(state: ListState): Record<string, string | number> {
  const query: Record<string, string | number> = { page: state.page, page_size: state.pageSize };
  if (state.ordering) query.ordering = state.ordering;
  if (state.search.trim()) query.search = state.search.trim();
  for (const [key, value] of Object.entries(state.filters)) if (value !== "") query[key] = value;
  return query;
}

/** Filters + search + ordering only, as saved views and exports store them. */
export function toSavedFilters(state: ListState): Record<string, string> {
  const saved: Record<string, string> = {};
  for (const [key, value] of Object.entries(state.filters)) if (value !== "") saved[key] = value;
  if (state.search.trim()) saved.search = state.search.trim();
  return saved;
}

export function useListState(overrides: Partial<ListState> = {}) {
  const [state, setState] = useState<ListState>(() => initialListState(overrides));

  const setPage = useCallback((page: number) => setState((s) => ({ ...s, page })), []);
  const setPageSize = useCallback(
    (pageSize: number) => setState((s) => ({ ...s, pageSize, page: 1 })),
    [],
  );
  const setOrdering = useCallback(
    (ordering: string) => setState((s) => ({ ...s, ordering, page: 1 })),
    [],
  );
  const setSearch = useCallback((search: string) => setState((s) => ({ ...s, search, page: 1 })), []);
  const setFilter = useCallback(
    (key: string, value: string) =>
      setState((s) => ({ ...s, page: 1, filters: { ...s.filters, [key]: value } })),
    [],
  );
  const replace = useCallback(
    (next: Partial<ListState>) => setState((s) => ({ ...s, page: 1, ...next })),
    [],
  );
  const reset = useCallback(() => setState(initialListState(overrides)), [overrides]);
  const toggleColumn = useCallback(
    (key: string) =>
      setState((s) => ({
        ...s,
        hidden: s.hidden.includes(key) ? s.hidden.filter((k) => k !== key) : [...s.hidden, key],
      })),
    [],
  );

  const query = useMemo(() => toQuery(state), [state]);
  return { state, query, setPage, setPageSize, setOrdering, setSearch, setFilter, replace, reset, toggleColumn };
}

export type ListController = ReturnType<typeof useListState>;
