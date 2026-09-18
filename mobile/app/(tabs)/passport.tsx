import { router } from "expo-router";
import {
  ChevronRight,
  HelpCircle,
  Landmark,
  MoreVertical,
  Share2,
  ShieldCheck,
  Smartphone,
} from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BouncyPressable } from "../../components/animated/bouncy-pressable";
import { PassportCard } from "../../components/cards/passport-card";
import { useTamvaStore } from "../../store/use-tamva-store";

export default function PassportScreen() {
  const { user, behavioralPillars, passportActivities, revokePassportShare } = useTamvaStore();
  const [activeTab, setActiveTab] = useState<"Overview" | "Share" | "Access History" | "Settings">("Overview");

  return (
    <View className="flex-1 bg-ink">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerClassName="px-5 pb-32"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pt-2">
            <View>
              <Text className="text-2xl font-black text-white">Financial Passport</Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                Your financial story. In your hands.
              </Text>
            </View>

            <BouncyPressable className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface">
              <HelpCircle size={18} color="#75f0bd" />
            </BouncyPressable>
          </View>

          {/* Signature Digital Passport Card */}
          <View className="mt-5">
            <PassportCard
              name={user.name}
              country={user.country}
              memberSince={user.memberSince}
              status="Active"
              onSharePress={() => router.push("/passport-create")}
            />
          </View>

          {/* Sub Navigation Tabs */}
          <View className="mt-5 flex-row rounded-2xl bg-surface/80 p-1 border border-white/5">
            {(["Overview", "Share", "Access History", "Settings"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab);
                    if (tab === "Share") {
                      router.push("/passport-create");
                    }
                  }}
                  className={`flex-1 py-2 items-center rounded-xl ${
                    isActive ? "bg-forest border border-mint/30" : ""
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      isActive ? "text-mint" : "text-slate-400"
                    }`}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Passport Summary 2x3 Grid */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-base font-bold text-white">Passport Summary</Text>
                <Text className="text-xs text-slate-400">
                  A snapshot of your financial identity.
                </Text>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/profile")}>
                <Text className="text-xs font-semibold text-mint">View full profile →</Text>
              </Pressable>
            </View>

            <View className="flex-row flex-wrap gap-2.5 justify-between">
              {behavioralPillars.map((pillar) => (
                <BouncyPressable
                  key={pillar.id}
                  onPress={() => router.push("/confidence")}
                  className="w-[48%]"
                >
                  <View className="rounded-2xl border border-white/5 bg-surface p-3.5 flex-row items-center justify-between">
                    <View>
                      <Text className="text-[11px] font-medium text-slate-400">{pillar.name}</Text>
                      <View className="flex-row items-baseline gap-1 mt-0.5">
                        <Text className="text-lg font-bold text-white">{pillar.score}</Text>
                        <Text className="text-[10px] text-slate-500 font-semibold">/100</Text>
                      </View>
                    </View>
                    <ChevronRight size={14} color="#64748b" />
                  </View>
                </BouncyPressable>
              ))}
            </View>
          </View>

          {/* Verified & Secure Guarantee Card */}
          <BouncyPressable className="mt-4">
            <View className="flex-row items-center justify-between rounded-2xl border border-emeraldPrimary/20 bg-emerald-950/40 p-4">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-emeraldPrimary/20">
                  <ShieldCheck size={20} color="#00d084" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">Verified & Secure</Text>
                  <Text className="mt-0.5 text-[11px] text-emerald-300/80">
                    Your data is encrypted and shared only with institutions you approve.
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#75f0bd" />
            </View>
          </BouncyPressable>

          {/* Recent Passport Activities (Access & Audit Log) */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-white">Recent Passport Activities</Text>
              <Text className="text-xs font-semibold text-mint">See all →</Text>
            </View>

            <View className="gap-2.5">
              {passportActivities.map((act) => {
                const isRevoked = act.status === "REVOKED";
                return (
                  <View
                    key={act.id}
                    className={`rounded-2xl border border-white/5 bg-surface p-3.5 flex-row items-center justify-between ${
                      isRevoked ? "opacity-50" : ""
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint/10">
                        {act.recipientLogo === "smartphone" ? (
                          <Smartphone size={18} color="#75f0bd" />
                        ) : (
                          <Landmark size={18} color="#75f0bd" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-white" numberOfLines={1}>
                          Shared with {act.recipientName}
                        </Text>
                        <Text className="mt-0.5 text-[11px] text-slate-400" numberOfLines={1}>
                          {act.purpose}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end gap-1">
                      <Text className="text-[11px] font-medium text-slate-500">
                        {act.sharedAt}
                      </Text>
                      {isRevoked ? (
                        <Text className="text-[10px] font-bold text-rose-400">Revoked</Text>
                      ) : (
                        <BouncyPressable onPress={() => revokePassportShare(act.id)}>
                          <Text className="text-[10px] font-bold text-amber-400">Revoke</Text>
                        </BouncyPressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Floating Action Button: Share My Passport */}
        <View className="absolute bottom-6 inset-x-5">
          <BouncyPressable
            onPress={() => router.push("/passport-create")}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-emeraldPrimary py-4 shadow-xl active:bg-emerald-400"
          >
            <Share2 size={18} color="#07130f" strokeWidth={2.5} />
            <Text className="text-base font-extrabold text-ink">Share My Passport</Text>
          </BouncyPressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
