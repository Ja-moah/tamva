import React from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

interface SparklineProps {
  data?: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
}

export function Sparkline({
  data = [72, 75, 78, 81, 83, 89],
  width = 110,
  height = 42,
  strokeColor = "#00d084",
  fillColor = "#00d084",
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 6) + 3;
    const y = height - 4 - ((val - min) / range) * (height - 10);
    return { x, y };
  });

  // Generate cubic bezier curve path for ultra-smooth rendering
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    pathD += ` C ${cpX} ${curr.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={fillColor} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        <Path d={areaD} fill="url(#sparklineGrad)" />
        <Path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
