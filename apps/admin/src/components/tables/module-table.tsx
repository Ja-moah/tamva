import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { StatusBadge } from "../feedback/status-badge";

type ModuleRow = {
  module: string;
  responsibility: string;
  api: string;
};

const rows: ModuleRow[] = [
  { module: "Identity", responsibility: "Human and service identity, Ghana Card hashes", api: "Foundation" },
  { module: "Partner", responsibility: "Institution tenancy and membership", api: "Foundation" },
  { module: "Risk", responsibility: "Evaluation, decisions, velocity, and reason codes", api: "Foundation" },
  { module: "Case", responsibility: "Alerts, SAR escalation, and investigation lifecycle", api: "Foundation" },
];

const column = createColumnHelper<ModuleRow>();
const columns = [
  column.accessor("module", {
    header: "Domain Subsystem",
    cell: (info) => (
      <span className="font-semibold text-[var(--text-primary)] text-sm">
        {info.getValue()}
      </span>
    ),
  }),
  column.accessor("responsibility", {
    header: "Core Responsibilities",
    cell: (info) => (
      <span className="text-[var(--text-secondary)] text-sm">
        {info.getValue()}
      </span>
    ),
  }),
  column.accessor("api", {
    header: "API Subsystem Status",
    cell: (info) => (
      <StatusBadge tone={info.getValue() === "Foundation" ? "success" : "neutral"} size="md">
        {info.getValue()}
      </StatusBadge>
    ),
  }),
];

export function ModuleTable() {
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)]">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-[var(--bg-surface-elevated)] transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3.5 text-sm text-[var(--text-primary)]">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
