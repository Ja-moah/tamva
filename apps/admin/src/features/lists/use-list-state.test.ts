import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { initialListState, toQuery, toSavedFilters, useListState } from "./use-list-state";

describe("list state", () => {
  it("builds a query with only meaningful params", () => {
    const state = { ...initialListState(), ordering: "-score", search: " ama ", filters: { decision: "BLOCK", empty: "" } };
    expect(toQuery(state)).toEqual({ page: 1, page_size: 25, ordering: "-score", search: "ama", decision: "BLOCK" });
  });

  it("stores filters and search for saved views and exports, but not paging", () => {
    const state = { ...initialListState(), page: 4, filters: { status: "OPEN", x: "" }, search: "abc" };
    expect(toSavedFilters(state)).toEqual({ status: "OPEN", search: "abc" });
  });

  it("returns to page 1 whenever the result set changes", () => {
    const { result } = renderHook(() => useListState());
    act(() => result.current.setPage(3));
    expect(result.current.state.page).toBe(3);
    act(() => result.current.setFilter("status", "OPEN"));
    expect(result.current.state.page).toBe(1);
    act(() => result.current.setPage(2));
    act(() => result.current.setOrdering("-opened_at"));
    expect(result.current.state.page).toBe(1);
    act(() => result.current.setPage(2));
    act(() => result.current.setPageSize(50));
    expect(result.current.state).toMatchObject({ page: 1, pageSize: 50 });
  });

  it("toggles column visibility and resets to the initial state", () => {
    const { result } = renderHook(() => useListState({ ordering: "-x" }));
    act(() => result.current.toggleColumn("a"));
    expect(result.current.state.hidden).toEqual(["a"]);
    act(() => result.current.toggleColumn("a"));
    expect(result.current.state.hidden).toEqual([]);
    act(() => result.current.setSearch("q"));
    act(() => result.current.reset());
    expect(result.current.state).toMatchObject({ search: "", ordering: "-x" });
  });
});
