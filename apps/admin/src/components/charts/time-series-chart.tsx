import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface Series {
  key: string;
  label: string;
  color: string;
}

/** Multi-series daily counts. `x` must be a display-ready string. */
export function TimeSeriesChart({
  data,
  series,
  label,
  height = 270,
}: {
  data: Array<Record<string, string | number>>;
  series: Series[];
  label: string;
  height?: number;
}) {
  return (
    <div className="w-full pt-2" style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
          <XAxis dataKey="x" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={{ stroke: "var(--border-default)" }} fontFamily="var(--font-mono)" />
          <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-strong)",
              borderRadius: "0.375rem",
              color: "var(--text-primary)",
              fontSize: "13px",
            }}
          />
          <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingBottom: "12px", color: "var(--text-secondary)" }} />
          {series.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} fill={s.color} fillOpacity={0.12} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
