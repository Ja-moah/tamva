import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const distributionData = [
  { name: "Tier 1: Low (0–30)", count: 9840, color: "#10b981", percent: "86.2%" },
  { name: "Tier 2: Medium (31–60)", count: 1240, color: "#d4a017", percent: "10.8%" },
  { name: "Tier 3: High (61–85)", count: 280, color: "#f97316", percent: "2.5%" },
  { name: "Tier 4: Critical (86+)", count: 48, color: "#e11d48", percent: "0.5%" },
];

export function RiskDistributionChart() {
  return (
    <div className="h-[220px] w-full pt-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={distributionData}
          layout="vertical"
          margin={{ top: 8, right: 30, left: 16, bottom: 0 }}
        >
          <XAxis
            type="number"
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val > 999 ? `${(val / 1000).toFixed(1)}k` : val}`}
            fontFamily="var(--font-mono)"
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--text-primary)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={160}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-strong)",
              borderRadius: "0.375rem",
              boxShadow: "var(--shadow-md)",
              color: "var(--text-primary)",
              fontSize: "13px",
            }}
            formatter={(value: unknown) => [
              `${Number(value).toLocaleString()} transactions`,
              "Evaluated Load",
            ]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
            {distributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
