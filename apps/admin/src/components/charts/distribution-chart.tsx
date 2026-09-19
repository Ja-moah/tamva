import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface DistributionDatum {
  name: string;
  count: number;
  color?: string;
}

const tooltipStyle = {
  backgroundColor: "var(--bg-surface)",
  borderColor: "var(--border-strong)",
  borderRadius: "0.375rem",
  boxShadow: "var(--shadow-md)",
  color: "var(--text-primary)",
  fontSize: "13px",
} as const;

/** Horizontal bar distribution over real counts. */
export function DistributionChart({
  data,
  unit = "records",
  height = 220,
  label,
}: {
  data: DistributionDatum[];
  unit?: string;
  height?: number;
  label: string;
}) {
  return (
    <div className="w-full pt-1" style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <XAxis type="number" allowDecimals={false} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
          <YAxis type="category" dataKey="name" stroke="var(--text-primary)" fontSize={12} tickLine={false} axisLine={false} width={120} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: unknown) => [`${Number(value).toLocaleString()} ${unit}`, ""]} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color ?? "var(--accent-emerald)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
