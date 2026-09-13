import { router } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Landmark,
  Lightbulb,
  PieChart,
  PiggyBank,
  ShieldCheck,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BouncyPressable } from "../../components/animated/bouncy-pressable";
import { Sparkline } from "../../components/animated/sparkline";
import { PillarScoreCard } from "../../components/cards/pillar-score-card";
import { useTamvaStore } from "../../store/use-tamva-store";

export default function ProfileScreen() {
  const { user, behavioralPillars, accounts } = useTamvaStore();
  const [activeSubTab, setActiveSubTab] = useState<"Overview" | "Insights" | "Trends">("Overview");

  return (
    <View className="flex-1 bg-ink">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerClassName="px-5 pb-28"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pt-2">
            <View>
              <Text className="text-2xl font-black text-white">Financial Profile</Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                A clearer picture of your financial life.
              </Text>
            </View>

            <BouncyPressable
              onPress={() => router.push("/notifications")}
              className="relative h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface"
            >
              <Bell size={18} color="#ffffff" />
              <View className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-rose-500 border-2 border-ink">
                <Text className="text-[9px] font-bold text-white">1</Text>
              </View>
            </BouncyPressable>
          </View>

          {/* Sub Navigation Tabs */}
          <View className="mt-5 flex-row rounded-2xl bg-surface/80 p-1 border border-white/5">
            {(["Overview", "Insights", "Trends"] as const).map((tab) => {
              const isActive = activeSubTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveSubTab(tab)}
                  className={`flex-1 py-2.5 items-center rounded-xl ${
                    isActive ? "bg-forest border border-mint/30" : ""
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isActive ? "text-mint" : "text-slate-400"
                    }`}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Profile & Financial Confidence Hero Card */}
          <BouncyPressable
            onPress={() => router.push("/confidence")}
            className="mt-4"
          >
            <View className="rounded-[28px] border border-mint/30 bg-surface p-5 shadow-xl">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emeraldPrimary/20 border border-emeraldPrimary/40">
                    <Text className="text-base font-bold text-mint">{user.initials}</Text>
                  </View>
                  <View>
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-base font-bold text-white">{user.name}</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <Text className="text-xs text-slate-400">{user.type}</Text>
                      <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5">
                        <CheckCircle2 size={10} color="#00d084" />
                        <Text className="text-[10px] font-bold text-emerald-400">
                          {user.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <View className="mt-5 flex-row items-end justify-between border-t border-white/5 pt-4">
                <View>
                  <Text className="text-xs font-semibold text-slate-400">
                    Financial Confidence
                  </Text>
                  <View className="flex-row items-baseline gap-1 mt-1">
                    <Text className="text-3xl font-black text-white">
                      {user.confidenceScore}
                    </Text>
                    <Text className="text-xs font-bold text-slate-400">/100</Text>
                  </View>
                  <Text className="mt-0.5 text-[11px] font-semibold text-mint">
                    ↑ {user.scoreChange}
                  </Text>
                </View>

                <View className="items-end">
                  <Sparkline width={120} height={40} strokeColor="#75f0bd" fillColor="#75f0bd" />
                  <Text className="mt-1 text-[10px] font-medium text-slate-500">
                    Updated today
                  </Text>
                </View>
              </View>
            </View>
          </BouncyPressable>

          {/* Behavioral Pillars 2x2 Grid */}
          <View className="mt-5 flex-row flex-wrap gap-3 justify-between">
            {behavioralPillars.slice(0, 4).map((pillar) => (
              <PillarScoreCard
                key={pillar.id}
                pillar={pillar}
                onPress={() => router.push("/confidence")}
              />
            ))}
          </View>

          {/* Financial Resilience Full Width Card */}
          {behavioralPillars[5] && (
            <BouncyPressable
              onPress={() => router.push("/confidence")}
              className="mt-3"
            >
              <View className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-surface p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                    <ShieldCheck size={20} color="#00d084" />
                  </View>
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs font-medium text-slate-400">
                        {behavioralPillars[5].name}
                      </Text>
                      <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-emerald-400">
                          {behavioralPillars[5].status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xl font-bold text-white mt-0.5">
                      {behavioralPillars[5].score}
                      <Text className="text-xs font-normal text-slate-500">/100</Text>
                    </Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5">
                      {behavioralPillars[5].description}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#75f0bd" />
              </View>
            </BouncyPressable>
          )}

          {/* Monthly Cash Flow Breakdown (Jun 2026) */}
          <View className="mt-6 rounded-[26px] border border-white/10 bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-white">Monthly Cash Flow</Text>
              <Text className="text-xs font-semibold text-mint">View details →</Text>
            </View>

            <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
              <View className="w-[47%] rounded-2xl bg-black/30 p-3">
                <View className="flex-row items-center gap-1.5">
                  <ArrowDownLeft size={14} color="#00d084" />
                  <Text className="text-[11px] font-semibold text-slate-400">Inflow</Text>
                </View>
                <Text className="mt-1 text-sm font-bold text-white">
                  GH₵ {user.monthlyInflow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View className="w-[47%] rounded-2xl bg-black/30 p-3">
                <View className="flex-row items-center gap-1.5">
                  <ArrowUpRight size={14} color="#f43f5e" />
                  <Text className="text-[11px] font-semibold text-slate-400">Outflow</Text>
                </View>
                <Text className="mt-1 text-sm font-bold text-white">
                  GH₵ {user.monthlyOutflow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View className="w-[47%] rounded-2xl bg-black/30 p-3">
                <View className="flex-row items-center gap-1.5">
                  <PiggyBank size={14} color="#3b82f6" />
                  <Text className="text-[11px] font-semibold text-slate-400">Savings</Text>
                </View>
                <Text className="mt-1 text-sm font-bold text-white">
                  GH₵ {user.monthlySavings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View className="w-[47%] rounded-2xl bg-black/30 p-3">
                <View className="flex-row items-center gap-1.5">
                  <TrendingDown size={14} color="#f59e0b" />
                  <Text className="text-[11px] font-semibold text-slate-400">Debt</Text>
                </View>
                <Text className="mt-1 text-sm font-bold text-white">
                  GH₵ {user.monthlyDebt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          {/* Financial Relationships (Connected Institutions) */}
          <BouncyPressable
            onPress={() => router.push("/consent")}
            className="mt-4"
          >
            <View className="rounded-[26px] border border-white/10 bg-surface p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint/10">
                    <Landmark size={20} color="#75f0bd" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-white">
                      Financial Relationships
                    </Text>
                    <Text className="text-xs text-slate-400">
                      {accounts.length} connected institutions
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#75f0bd" />
              </View>

              {/* Institution Badges Row */}
              <View className="mt-4 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-yellow-500">
                  <Smartphone size={16} color="#000000" />
                </View>
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <Landmark size={16} color="#ffffff" />
                </View>
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-red-600">
                  <CircleDot size={16} color="#ffffff" />
                </View>
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-white/10">
                  <PieChart size={16} color="#ffffff" />
                </View>
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-600">
                  <Zap size={16} color="#ffffff" />
                </View>
                <View className="h-8 px-2 items-center justify-center rounded-lg bg-white/10">
                  <Text className="text-[11px] font-bold text-slate-300">
                    +{accounts.length > 5 ? accounts.length - 5 : 1}
                  </Text>
                </View>
              </View>
            </View>
          </BouncyPressable>

          {/* Key Insight Card */}
          <BouncyPressable className="mt-4">
            <View className="flex-row items-center justify-between rounded-2xl border border-mint/20 bg-forest/30 p-4">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint/20">
                  <Lightbulb size={20} color="#75f0bd" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-mint">Key Insight</Text>
                  <Text className="text-xs font-medium text-white mt-0.5">
                    Your income has remained consistent over the last 6 months.
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#75f0bd" />
            </View>
          </BouncyPressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
