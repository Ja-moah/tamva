import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface ThroughputSparklineProps {
  data?: number[];
  color?: string;
}

const defaultData = [12, 18, 14, 22, 28, 25, 34, 40, 38, 48, 52, 49, 58, 62];

export function ThroughputSparkline({
  data = defaultData,
  color = "var(--accent-emerald)",
}: ThroughputSparklineProps) {
  const chartData = data.map((val, idx) => ({ i: idx, val }));

  return (
    <div className="h-9 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="val"
            stroke={color}
            strokeWidth={1.5}
            fill={color}
            fillOpacity={0.15}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
