import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils/cn";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export interface DataColumn<T> {
  /** Matches the resource catalog column key where one exists, so saved views line up. */
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Backend ordering field; omit for columns that cannot be sorted. */
  sortKey?: string;
  className?: string;
  /** Always shown; not offered in the column menu. */
  always?: boolean;
}

interface DataTableProps<T> {
  caption: string;
  columns: DataColumn<T>[];
  rows: T[];
  rowId: (row: T) => string;
  ordering: string;
  onOrderingChange: (ordering: string) => void;
  hidden?: string[];
  selected?: ReadonlySet<string>;
  onSelectedChange?: (selected: Set<string>) => void;
  onRowOpen?: (row: T) => void;
  isFetching?: boolean;
}

function nextOrdering(current: string, sortKey: string): string {
  if (current === sortKey) return `-${sortKey}`;
  if (current === `-${sortKey}`) return "";
  return sortKey;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowId,
  ordering,
  onOrderingChange,
  hidden = [],
  selected,
  onSelectedChange,
  onRowOpen,
  isFetching,
}: DataTableProps<T>) {
  const visible = columns.filter((column) => column.always || !hidden.includes(column.key));
  const selectable = Boolean(selected && onSelectedChange);
  const allSelected = selectable && rows.length > 0 && rows.every((row) => selected!.has(rowId(row)));

  const toggleAll = () => {
    if (!selected || !onSelectedChange) return;
    const next = new Set(selected);
    for (const row of rows) {
      if (allSelected) next.delete(rowId(row));
      else next.add(rowId(row));
    }
    onSelectedChange(next);
  };
  const toggleOne = (id: string) => {
    if (!selected || !onSelectedChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  };

  return (
    <Card className={cn("overflow-hidden transition-opacity", isFetching && "opacity-70")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs" aria-busy={isFetching}>
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)]">
            <tr>
              {selectable ? (
                <th scope="col" className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all rows on this page"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="size-4 cursor-pointer accent-[var(--accent-emerald)]"
                  />
                </th>
              ) : null}
              {visible.map((column) => {
                const sorted =
                  column.sortKey && ordering === column.sortKey
                    ? "ascending"
                    : column.sortKey && ordering === `-${column.sortKey}`
                      ? "descending"
                      : "none";
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={column.sortKey ? sorted : undefined}
                    className={cn(
                      "px-3 py-2.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]",
                      column.className,
                    )}
                  >
                    {column.sortKey ? (
                      <button
                        type="button"
                        onClick={() => onOrderingChange(nextOrdering(ordering, column.sortKey!))}
                        className="inline-flex cursor-pointer items-center gap-1 uppercase hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]"
                      >
                        {column.header}
                        {sorted === "ascending" ? (
                          <ArrowUp className="size-3" aria-hidden />
                        ) : sorted === "descending" ? (
                          <ArrowDown className="size-3" aria-hidden />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-50" aria-hidden />
                        )}
                        <span className="sr-only">
                          {sorted === "none" ? ", sortable" : `, sorted ${sorted}`}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {rows.map((row) => {
              const id = rowId(row);
              return (
                <tr
                  key={id}
                  data-selected={selected?.has(id) || undefined}
                  className={cn(
                    "transition-colors hover:bg-[var(--bg-surface-hover)] data-[selected]:bg-[var(--accent-gold-subtle)]",
                    onRowOpen && "cursor-pointer",
                  )}
                  onClick={onRowOpen ? () => onRowOpen(row) : undefined}
                  onKeyDown={
                    onRowOpen
                      ? (event) => {
                          if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                            event.preventDefault();
                            onRowOpen(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowOpen ? 0 : undefined}
                >
                  {selectable ? (
                    <td className="px-3 py-2.5" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select row ${id}`}
                        checked={selected!.has(id)}
                        onChange={() => toggleOne(id)}
                        className="size-4 cursor-pointer accent-[var(--accent-emerald)]"
                      />
                    </td>
                  ) : null}
                  {visible.map((column) => (
                    <td key={column.key} className={cn("px-3 py-2.5 align-middle", column.className)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const PAGE_SIZES = [10, 25, 50, 100];

export function Pagination({
  page,
  pageSize,
  count,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const first = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(count, page * pageSize);
  return (
    <nav
      aria-label="Pagination"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]"
    >
      <p aria-live="polite">
        {first}–{last} of <strong className="text-[var(--text-primary)]">{count.toLocaleString()}</strong>
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          Rows
          <select
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
            className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-1.5 py-1"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <ChevronLeft className="size-3.5" aria-hidden />
          </Button>
          <span className="px-2 font-mono">
            {page} / {pages}
          </span>
          <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </nav>
  );
}
