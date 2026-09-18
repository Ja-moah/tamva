import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const customerTierData = [
  { name: "Tier 3: Biometric Verified (Passport)", count: 48200, color: "#10b981", percent: "28.6%" },
  { name: "Tier 2: Ghana Card Verified", count: 86400, color: "#d4a017", percent: "51.3%" },
  { name: "Tier 1: Basic Profile / MoMo", count: 32100, color: "#64748b", percent: "19.0%" },
  { name: "Enhanced Due Diligence (PEP/Watch)", count: 1840, color: "#e11d48", percent: "1.1%" },
];

export function CustomerTierDistributionChart() {
  return (
    <div className="h-[220px] w-full flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="h-[200px] w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-strong)",
                borderRadius: "0.375rem",
                boxShadow: "var(--shadow-md)",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
              }}
              formatter={(value: unknown) => [
                `${Number(value).toLocaleString()} identities`,
                "Registrations",
              ]}
            />
            <Pie
              data={customerTierData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={82}
              paddingAngle={3}
              dataKey="count"
              stroke="var(--bg-surface)"
              strokeWidth={2}
            >
              {customerTierData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full sm:w-1/2 space-y-2.5 pr-2">
        {customerTierData.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="size-3 rounded-sm shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {item.percent}
              </span>
              <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                {item.count.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
