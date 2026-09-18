import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const velocityData = [
  { time: "00:00", volume: 4200, riskEvents: 14 },
  { time: "02:00", volume: 2800, riskEvents: 8 },
  { time: "04:00", volume: 1900, riskEvents: 4 },
  { time: "06:00", volume: 3400, riskEvents: 12 },
  { time: "08:00", volume: 9200, riskEvents: 48 },
  { time: "10:00", volume: 16800, riskEvents: 82 },
  { time: "12:00", volume: 21400, riskEvents: 110 },
  { time: "14:00", volume: 19800, riskEvents: 94 },
  { time: "16:00", volume: 24500, riskEvents: 138 },
  { time: "18:00", volume: 18200, riskEvents: 76 },
  { time: "20:00", volume: 11400, riskEvents: 42 },
  { time: "22:00", volume: 6800, riskEvents: 22 },
];

export function RiskVelocityChart() {
  return (
    <div className="h-[270px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={velocityData}
          margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-gold)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--accent-gold)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-default)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "var(--border-default)" }}
            fontFamily="var(--font-mono)"
          />
          <YAxis
            yAxisId="left"
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value > 999 ? `${(value / 1000).toFixed(0)}k` : value}`}
            fontFamily="var(--font-mono)"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
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
            formatter={(value: unknown, name: unknown) => [
              Number(value).toLocaleString(),
              name === "volume" ? "Transaction Volume (GH₵)" : "Risk Flags & Alerts",
            ]}
            labelFormatter={(label) => `Time Window: ${label}`}
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
              value === "volume" ? "Transaction Volume (GH₵)" : "Risk Anomaly Flags"
            }
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="volume"
            stroke="var(--accent-emerald)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#volumeGradient)"
            name="volume"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="riskEvents"
            stroke="var(--accent-gold)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#riskGradient)"
            name="riskEvents"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

