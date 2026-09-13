import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  Info,
  ShieldCheck,
  Trash2,
} from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BouncyPressable } from "../components/animated/bouncy-pressable";
import { useTamvaStore } from "../store/use-tamva-store";

export default function NotificationsScreen() {
  const { securityAlerts } = useTamvaStore();
  const [filter, setFilter] = useState<"ALL" | "SECURITY" | "CONSENT">("ALL");

  const filteredAlerts = securityAlerts.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "SECURITY") return item.type === "WARNING" || item.type === "SUCCESS";
    if (filter === "CONSENT") return item.type === "INFO";
    return true;
  });

  return (
    <View className="flex-1 bg-ink">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView contentContainerClassName="px-5 pb-24" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center justify-between pt-2">
            <BouncyPressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface"
            >
              <ArrowLeft size={20} color="#ffffff" />
            </BouncyPressable>

            <View className="items-center">
              <Text className="text-base font-bold text-white">Notifications</Text>
              <Text className="text-[11px] text-slate-400">Security & Trust Feed</Text>
            </View>

            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface border border-white/10">
              <Bell size={18} color="#75f0bd" />
            </View>
          </View>

          {/* Filter Pills */}
          <View className="mt-5 flex-row gap-2">
            {(["ALL", "SECURITY", "CONSENT"] as const).map((cat) => {
              const isSelected = filter === cat;
              return (
                <BouncyPressable
                  key={cat}
                  onPress={() => setFilter(cat)}
                  className={`rounded-full px-4 py-2 ${
                    isSelected ? "bg-mint border border-mint" : "bg-surface border border-white/5"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? "text-ink" : "text-slate-300"
                    }`}
                  >
                    {cat}
                  </Text>
                </BouncyPressable>
              );
            })}
          </View>

          {/* Alert List */}
          <View className="mt-5 gap-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => {
                const isWarning = alert.type === "WARNING";
                const isInfo = alert.type === "INFO";
                return (
                  <View
                    key={alert.id}
                    className="rounded-2xl border border-white/5 bg-surface p-4 flex-row items-start gap-3.5"
                  >
                    <View
                      className={`h-10 w-10 items-center justify-center rounded-xl mt-0.5 ${
                        isWarning
                          ? "bg-amber-500/20"
                          : isInfo
                          ? "bg-blue-500/20"
                          : "bg-emerald-500/20"
                      }`}
                    >
                      {isWarning ? (
                        <AlertTriangle size={20} color="#f59e0b" />
                      ) : isInfo ? (
                        <Info size={20} color="#3b82f6" />
                      ) : (
                        <CheckCircle2 size={20} color="#00d084" />
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-bold text-white flex-1 pr-2">
                          {alert.title}
                        </Text>
                        <Text className="text-[10px] text-slate-500 font-medium">
                          {alert.dateFormatted}
                        </Text>
                      </View>
                      <Text className="mt-1 text-xs leading-4 text-slate-400">
                        {alert.description}
                      </Text>
                      {alert.location && (
                        <Text className="mt-1.5 text-[10px] font-mono text-emerald-400">
                          Location: {alert.location}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="items-center py-16">
                <ShieldCheck size={48} color="#64748b" />
                <Text className="text-sm font-bold text-slate-400 mt-3">
                  All caught up!
                </Text>
                <Text className="text-xs text-slate-500 text-center max-w-xs mt-1">
                  No new security or consent notifications at this time.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
