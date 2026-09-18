import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  columns: 2 | 4;
};

export function FeatureCard({ title, description, icon: Icon, columns }: FeatureCardProps) {
  return (
    <View
      className="min-h-40 rounded-3xl border border-slate-200 bg-white p-4"
      style={{ width: columns === 4 ? "23.5%" : "48%" }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
        <Icon color="#123b2d" size={20} strokeWidth={1.8} />
      </View>
      <Text className="mt-5 text-base font-bold text-ink">{title}</Text>
      <Text className="mt-1 text-sm leading-5 text-slate-500">{description}</Text>
    </View>
  );
}
