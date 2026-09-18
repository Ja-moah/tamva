import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const caseTrendsData = [
  { day: "Mon", newCases: 18, resolved: 22, escalated: 3 },
  { day: "Tue", newCases: 24, resolved: 21, escalated: 5 },
  { day: "Wed", newCases: 16, resolved: 19, escalated: 2 },
  { day: "Thu", newCases: 28, resolved: 26, escalated: 6 },
  { day: "Fri", newCases: 32, resolved: 30, escalated: 4 },
  { day: "Sat", newCases: 12, resolved: 14, escalated: 1 },
  { day: "Sun", newCases: 9, resolved: 11, escalated: 1 },
];

export function CaseTriageChart() {
  return (
    <div className="h-[250px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={caseTrendsData}
          margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-default)"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "var(--border-default)" }}
            fontFamily="var(--font-mono)"
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            fontFamily="var(--font-mono)"
          />
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
            formatter={(value: any, name: any) => [
              value,
              name === "newCases"
                ? "New Incident Inflow"
                : name === "resolved"
                ? "Resolved within SLA"
                : "Escalated to FIC (SAR)",
            ]}
            labelFormatter={(label) => `Day: ${label}`}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: "12px",
              paddingBottom: "12px",
              color: "var(--text-secondary)",
            }}
            formatter={(value) =>
              value === "newCases"
                ? "New Incident Inflow"
                : value === "resolved"
                ? "Resolved within SLA"
                : "Escalated to FIC"
            }
          />
          <Bar
            dataKey="newCases"
            fill="#d4a017"
            radius={[3, 3, 0, 0]}
            maxBarSize={16}
          />
          <Bar
            dataKey="resolved"
            fill="#10b981"
            radius={[3, 3, 0, 0]}
            maxBarSize={16}
          />
          <Bar
            dataKey="escalated"
            fill="#e11d48"
            radius={[3, 3, 0, 0]}
            maxBarSize={16}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

