import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DataTable, Pagination, type DataColumn } from "./data-table";

interface Row { id: string; name: string; score: number }
const rows: Row[] = [{ id: "a", name: "Ama", score: 10 }, { id: "b", name: "Kofi", score: 20 }];
const columns: DataColumn<Row>[] = [
  { key: "name", header: "Name", sortKey: "name", always: true, cell: (r) => r.name },
  { key: "score", header: "Score", sortKey: "score", cell: (r) => r.score },
  { key: "plain", header: "Plain", cell: () => "x" },
];

function setup(ordering = "", extra: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) {
  const onOrderingChange = vi.fn();
  render(<DataTable caption="People" columns={columns} rows={rows} rowId={(r) => r.id} ordering={ordering} onOrderingChange={onOrderingChange} {...extra} />);
  return { onOrderingChange };
}

describe("DataTable", () => {
  it("cycles sort ascending → descending → none on the backend sort key", async () => {
    const user = userEvent.setup();
    const asc = setup();
    await user.click(screen.getByRole("button", { name: /^score/i }));
    expect(asc.onOrderingChange).toHaveBeenLastCalledWith("score");
  });

  it("descends after ascending and clears after descending", async () => {
    const user = userEvent.setup();
    const { onOrderingChange } = setup("score");
    await user.click(screen.getByRole("button", { name: /^score/i }));
    expect(onOrderingChange).toHaveBeenLastCalledWith("-score");
  });

  it("clears the sort after descending", async () => {
    const user = userEvent.setup();
    const { onOrderingChange } = setup("-score");
    await user.click(screen.getByRole("button", { name: /^score/i }));
    expect(onOrderingChange).toHaveBeenLastCalledWith("");
  });

  it("exposes sort state to assistive tech and leaves unsortable columns as plain headers", () => {
    setup("-score");
    expect(screen.getByRole("columnheader", { name: /score/i })).toHaveAttribute("aria-sort", "descending");
    expect(screen.getByRole("columnheader", { name: /^name/i })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: "Plain" })).not.toHaveAttribute("aria-sort");
    expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
  });

  it("hides columns the user turned off, except always-on ones", () => {
    setup("", { hidden: ["score", "name"] });
    expect(screen.queryByRole("columnheader", { name: /score/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^name/i })).toBeInTheDocument();
  });

  it("selects rows and all rows on the page", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    setup("", { selected: new Set<string>(), onSelectedChange });
    await user.click(screen.getByRole("checkbox", { name: "Select row a" }));
    expect(onSelectedChange).toHaveBeenLastCalledWith(new Set(["a"]));
    await user.click(screen.getByRole("checkbox", { name: /select all rows/i }));
    expect(onSelectedChange).toHaveBeenLastCalledWith(new Set(["a", "b"]));
  });

  it("opens a row with the keyboard", async () => {
    const user = userEvent.setup();
    const onRowOpen = vi.fn();
    setup("", { onRowOpen });
    const row = screen.getByRole("row", { name: /ama/i });
    row.focus();
    await user.keyboard("{Enter}");
    expect(onRowOpen).toHaveBeenCalledWith(rows[0]);
  });
});

describe("Pagination", () => {
  it("reports the visible range and total, and disables edges", async () => {
    const user = userEvent.setup();
    const onPage = vi.fn();
    render(<Pagination page={1} pageSize={25} count={60} onPage={onPage} onPageSize={() => {}} />);
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(nav).toHaveTextContent("1–25 of 60");
    expect(within(nav).getByRole("button", { name: /previous/i })).toBeDisabled();
    await user.click(within(nav).getByRole("button", { name: /next/i }));
    expect(onPage).toHaveBeenCalledWith(2);
  });

  it("handles an empty result", () => {
    render(<Pagination page={1} pageSize={25} count={0} onPage={() => {}} onPageSize={() => {}} />);
    expect(screen.getByRole("navigation")).toHaveTextContent("0–0 of 0");
  });
});
