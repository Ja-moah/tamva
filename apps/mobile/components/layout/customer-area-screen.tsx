import type { LucideIcon } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CustomerAreaScreenProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function CustomerAreaScreen({ title, description, icon: Icon }: CustomerAreaScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-cloud">
      <ScrollView contentContainerStyle={{ alignSelf: "center", maxWidth: 960, padding: 24, width: "100%" }}>
        <View className="rounded-[30px] border border-slate-200 bg-white p-6">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
            <Icon color="#123b2d" size={24} />
          </View>
          <Text className="mt-7 text-xs font-semibold uppercase tracking-[3px] text-emerald-800">Customer area</Text>
          <Text className="mt-2 text-3xl font-bold text-ink">{title}</Text>
          <Text className="mt-4 max-w-[640px] text-sm leading-6 text-slate-500">{description}</Text>
          <View className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Text className="text-sm leading-6 text-amber-950">
              This shared Android, iOS, and web surface is ready for its Django API. It does not generate customer records or business decisions locally.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
