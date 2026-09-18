import React from "react";
import { View } from "react-native";

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  backgroundColor?: string;
  height?: number;
  className?: string;
}

export function ProgressBar({
  progress,
  color = "#00d084",
  backgroundColor = "rgba(255, 255, 255, 0.1)",
  height = 8,
  className = "",
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View
      style={{ height, backgroundColor, borderRadius: height / 2 }}
      className={`w-full overflow-hidden ${className}`}
    >
      <View
        style={{
          width: `${clampedProgress}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

interface SplitProgressBarProps {
  inflow: number;
  outflow: number;
  height?: number;
}

export function SplitProgressBar({ inflow, outflow, height = 6 }: SplitProgressBarProps) {
  const total = inflow + outflow || 1;
  const inflowPercent = Math.round((inflow / total) * 100);
  const outflowPercent = 100 - inflowPercent;

  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1 overflow-hidden rounded-full bg-slate-800" style={{ height }}>
        <View
          style={{ width: `${inflowPercent}%`, height: "100%", backgroundColor: "#00d084" }}
          className="rounded-full"
        />
      </View>
      <View className="flex-1 overflow-hidden rounded-full bg-slate-800" style={{ height }}>
        <View
          style={{ width: `${outflowPercent}%`, height: "100%", backgroundColor: "#f59e0b" }}
          className="rounded-full"
        />
      </View>
    </View>
  );
}
