import { useQuery } from "@tanstack/react-query";
import { Bell, Fingerprint, ScrollText, ShieldCheck, WalletCards } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeatureCard } from "../components/feature-card";
import { getSystemHealth } from "../lib/api";

const features = [
  { title: "Activity", description: "Canonical financial activity", icon: ScrollText },
  { title: "Consent", description: "Control institution access", icon: Fingerprint },
  { title: "Passport", description: "Share verified financial identity", icon: WalletCards },
  { title: "Protection", description: "Review trust and safety signals", icon: ShieldCheck },
] as const;

export default function HomeScreen() {
  const health = useQuery({
    queryKey: ["system", "health"],
    queryFn: ({ signal }) => getSystemHealth(signal),
    refetchInterval: 60_000,
  });
  const connected = health.data?.status === "ok";

  return (
    <View className="flex-1 bg-cloud">
      <View className="absolute inset-x-0 top-0 h-72 bg-ink" />
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="px-5 pb-12" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between pt-3">
            <View>
              <Text className="text-xs font-semibold uppercase tracking-[3px] text-mint">TAMVA</Text>
              <Text className="mt-1 text-lg font-bold text-white">Financial identity</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10 active:bg-white/20"
            >
              <Bell color="#ffffff" size={20} />
            </Pressable>
          </View>

          <View className="mt-8 overflow-hidden rounded-[30px] bg-forest p-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-emerald-100">Your TAMVA passport</Text>
              <View className="rounded-full bg-white/10 px-3 py-1.5">
                <Text className="text-xs font-semibold text-white">Foundation</Text>
              </View>
            </View>
            <Text className="mt-8 text-3xl font-bold leading-10 text-white">One trusted financial identity.</Text>
            <Text className="mt-3 max-w-[280px] text-sm leading-6 text-emerald-100/70">
              Your information will appear only after you authorize a backend-managed connection.
            </Text>
            <View className="mt-7 flex-row items-center">
              <View className={`h-2 w-2 rounded-full ${connected ? "bg-mint" : "bg-amber-300"}`} />
              <Text className="ml-2 text-sm font-medium text-emerald-50">
                {health.isPending ? "Checking secure connection" : connected ? "Connected to TAMVA" : "Backend unavailable"}
              </Text>
            </View>
          </View>

          <View className="mt-8 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-ink">Your workspace</Text>
            <Text className="text-sm font-medium text-slate-500">API-led</Text>
          </View>
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </View>

          <View className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
            <Text className="text-base font-bold text-ink">Built around your consent</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">
              The app displays decisions from TAMVA's Django API. Consent, risk, access, and financial calculations never run in the mobile client.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
