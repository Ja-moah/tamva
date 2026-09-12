import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { StatusBadge } from "./ui/status-badge";

type ModuleRow = {
  module: string;
  responsibility: string;
  api: string;
};

const rows: ModuleRow[] = [
  { module: "Identity", responsibility: "Human and service identity", api: "Foundation" },
  { module: "Partner", responsibility: "Institution tenancy and membership", api: "Foundation" },
  { module: "Risk", responsibility: "Evaluation, decisions, and reason codes", api: "Pending" },
  { module: "Case", responsibility: "Alerts and investigation lifecycle", api: "Pending" },
];

const column = createColumnHelper<ModuleRow>();
const columns = [
  column.accessor("module", { header: "Domain" }),
  column.accessor("responsibility", { header: "Owned responsibility" }),
  column.accessor("api", {
    header: "API state",
    cell: (info) => (
      <StatusBadge tone={info.getValue() === "Foundation" ? "success" : "neutral"}>
        {info.getValue()}
      </StatusBadge>
    ),
  }),
];

export function ModuleTable() {
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-left">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-white/8">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.025]">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-5 py-4 text-sm text-slate-300">
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
