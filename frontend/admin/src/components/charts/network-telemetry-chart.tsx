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

const networkData = [
  { time: "16:00", ghipssTps: 420, papssTps: 180, momoTps: 890 },
  { time: "16:10", ghipssTps: 480, papssTps: 210, momoTps: 940 },
  { time: "16:20", ghipssTps: 560, papssTps: 260, momoTps: 1120 },
  { time: "16:30", ghipssTps: 510, papssTps: 230, momoTps: 1040 },
  { time: "16:40", ghipssTps: 630, papssTps: 290, momoTps: 1280 },
  { time: "16:50", ghipssTps: 690, papssTps: 340, momoTps: 1410 },
  { time: "17:00", ghipssTps: 620, papssTps: 310, momoTps: 1320 },
];

export function NetworkTelemetryChart() {
  return (
    <div className="h-[250px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={networkData}
          margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="ghipssGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d4a017" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#d4a017" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="momoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="papssGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
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
            stroke="var(--text-muted)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            fontFamily="var(--font-mono)"
            tickFormatter={(val) => `${val} tps`}
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
              `${value} tx/sec`,
              name === "momoTps"
                ? "Mobile Money Switch (GhIPSS/Telco)"
                : name === "ghipssTps"
                ? "GhIPSS Instant Pay (GIP)"
                : "PAPSS Cross-Border Rail",
            ]}
            labelFormatter={(label) => `Time: ${label}`}
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
              value === "momoTps"
                ? "MoMo Switch"
                : value === "ghipssTps"
                ? "GhIPSS Instant Pay"
                : "PAPSS Rail"
            }
          />
          <Area
            type="monotone"
            dataKey="momoTps"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#momoGradient)"
            name="momoTps"
          />
          <Area
            type="monotone"
            dataKey="ghipssTps"
            stroke="#d4a017"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#ghipssGradient)"
            name="ghipssTps"
          />
          <Area
            type="monotone"
            dataKey="papssTps"
            stroke="#38bdf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#papssGradient)"
            name="papssTps"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

