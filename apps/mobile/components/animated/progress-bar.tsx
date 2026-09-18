import { View } from "react-native";

interface ProgressBarProps {
  progress: number;
  color: string;
  height?: number;
}

export function ProgressBar({ progress, color, height = 6 }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: "#1e293b" }}>
      <View
        style={{
          width: `${clampedProgress}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
