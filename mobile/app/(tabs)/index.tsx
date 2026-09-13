import { router } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  MoreHorizontal,
  PiggyBank,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BouncyPressable } from "../../components/animated/bouncy-pressable";
import { SplitProgressBar } from "../../components/animated/progress-bar";
import { Sparkline } from "../../components/animated/sparkline";
import { TransactionRow } from "../../components/cards/transaction-row";
import { useTamvaStore } from "../../store/use-tamva-store";

export default function HomeDashboard() {
  const { user, showFunds, toggleShowFunds, transactions } = useTamvaStore();

  return (
    <View className="flex-1 bg-ink">
      {/* Background ambient glow */}
      <View className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-forest/30 blur-3xl opacity-60 pointer-events-none" />

      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerClassName="px-5 pb-24"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand & Notification Bar */}
          <View className="flex-row items-center justify-between pt-2">
            <View>
              <View className="flex-row items-center gap-2">
                <View className="h-6 w-6 items-center justify-center rounded-lg bg-mint/20">
                  <Sparkles size={14} color="#75f0bd" />
                </View>
                <Text className="text-base font-extrabold tracking-[2px] text-white">
                  TAMVA
                </Text>
              </View>
              <Text className="mt-0.5 text-xs text-slate-400">
                Your financial identity. Everywhere.
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <BouncyPressable
                onPress={() => router.push("/notifications")}
                className="relative h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface/80"
              >
                <Bell size={19} color="#ffffff" />
                <View className="absolute -top-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-rose-500 border-2 border-ink">
                  <Text className="text-[10px] font-bold text-white">1</Text>
                </View>
              </BouncyPressable>

              <BouncyPressable
                onPress={() => router.push("/(tabs)/profile")}
                className="h-11 w-11 items-center justify-center rounded-2xl bg-forest border border-mint/30"
              >
                <Text className="text-sm font-bold text-mint">{user.initials}</Text>
              </BouncyPressable>
            </View>
          </View>

          {/* User Greeting Card */}
          <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-white/5 bg-surface/40 p-3.5">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Text className="text-sm font-bold text-emerald-400">{user.initials}</Text>
              </View>
              <View>
                <Text className="text-xs text-slate-400">Good morning,</Text>
                <Text className="text-base font-bold text-white">{user.name.split(" ")[0]}</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1 rounded-full bg-mint/10 px-3 py-1.5 border border-mint/20">
              <Text className="text-[11px] font-bold text-mint">Build Grow Thrive</Text>
              <ChevronRight size={12} color="#75f0bd" />
            </View>
          </View>

          {/* Financial Confidence Score Card */}
          <BouncyPressable
            onPress={() => router.push("/confidence")}
            className="mt-4"
          >
            <View className="rounded-[28px] border border-mint/30 bg-surface p-5 shadow-xl">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-slate-400">
                  Financial Confidence
                </Text>
                <View className="rounded-full bg-emeraldPrimary/20 px-3 py-1 border border-emeraldPrimary/30">
                  <Text className="text-xs font-bold text-emeraldPrimary">
                    {user.scoreRating}
                  </Text>
                </View>
              </View>

              <View className="mt-2 flex-row items-end justify-between">
                <View>
                  <View className="flex-row items-baseline gap-1">
                    <Text className="text-4xl font-black text-white">
                      {user.confidenceScore}
                    </Text>
                    <Text className="text-sm font-bold text-slate-400">/100</Text>
                  </View>
                  <Text className="mt-1 text-xs font-semibold text-emeraldPrimary">
                    ↑ {user.scoreChange}
                  </Text>
                </View>

                {/* Animated SVG Sparkline Curve */}
                <Sparkline width={130} height={48} strokeColor="#00d084" fillColor="#00d084" />
              </View>

              <Text className="mt-3 text-xs text-slate-300">
                You're on a strong path. Keep it up!
              </Text>
            </View>
          </BouncyPressable>

          {/* Total Available Funds Card */}
          <View className="mt-4 rounded-[28px] border border-white/10 bg-forest p-6 shadow-lg relative overflow-hidden">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-emerald-200">
                Total Available Funds
              </Text>
              <BouncyPressable onPress={toggleShowFunds} className="p-1">
                {showFunds ? (
                  <Eye size={18} color="#75f0bd" />
                ) : (
                  <EyeOff size={18} color="#75f0bd" />
                )}
              </BouncyPressable>
            </View>

            <View className="mt-3">
              <Text className="text-3xl font-black text-white">
                {showFunds
                  ? `${user.fundsCurrency} ${user.availableFunds.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "••••••••••"}
              </Text>
              <Text className="mt-1 text-xs font-semibold text-mint">
                ↑ {user.fundsChangePercent} from last month
              </Text>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View className="mt-5 flex-row justify-between">
            <View className="items-center gap-1.5 flex-1">
              <BouncyPressable
                onPress={() => router.push("/(tabs)/activity")}
                className="h-14 w-14 items-center justify-center rounded-2xl bg-emeraldPrimary shadow-lg"
              >
                <ArrowUpRight size={22} color="#07130f" strokeWidth={2.5} />
              </BouncyPressable>
              <Text className="text-xs font-semibold text-slate-300">Send</Text>
            </View>

            <View className="items-center gap-1.5 flex-1">
              <BouncyPressable
                onPress={() => router.push("/(tabs)/activity")}
                className="h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-emeraldPrimary/30"
              >
                <ArrowDownLeft size={22} color="#75f0bd" strokeWidth={2.5} />
              </BouncyPressable>
              <Text className="text-xs font-semibold text-slate-300">Receive</Text>
            </View>

            <View className="items-center gap-1.5 flex-1">
              <BouncyPressable
                onPress={() => router.push("/(tabs)/profile")}
                className="h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg"
              >
                <PiggyBank size={22} color="#07130f" strokeWidth={2.5} />
              </BouncyPressable>
              <Text className="text-xs font-semibold text-slate-300">Save</Text>
            </View>

            <View className="items-center gap-1.5 flex-1">
              <BouncyPressable
                onPress={() => router.push("/consent")}
                className="h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-white/10"
              >
                <MoreHorizontal size={22} color="#ffffff" strokeWidth={2.5} />
              </BouncyPressable>
              <Text className="text-xs font-semibold text-slate-300">More</Text>
            </View>
          </View>

          {/* Financial Overview (This Month) */}
          <View className="mt-7 rounded-[26px] border border-white/10 bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-white">
                Financial Overview (This Month)
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/activity")}>
                <Text className="text-xs font-semibold text-mint">See more →</Text>
              </Pressable>
            </View>

            <View className="mt-4 flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-medium text-slate-400">Inflow</Text>
                <Text className="text-sm font-bold text-emeraldPrimary">
                  GH₵ {user.monthlyInflow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[11px] font-medium text-slate-400">Outflow</Text>
                <Text className="text-sm font-bold text-amber-400">
                  GH₵ {user.monthlyOutflow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View className="mt-3">
              <SplitProgressBar inflow={user.monthlyInflow} outflow={user.monthlyOutflow} />
            </View>
          </View>

          {/* Financial Protection Shield Card */}
          <BouncyPressable
            onPress={() => router.push("/(tabs)/protection")}
            className="mt-4"
          >
            <View className="flex-row items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <ShieldCheck size={20} color="#00d084" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-white">Financial Protection</Text>
                  <Text className="text-xs text-emerald-300/80">
                    No unusual activity detected.
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#75f0bd" />
            </View>
          </BouncyPressable>

          {/* Recent Activity List */}
          <View className="mt-7">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-white">Recent Activity</Text>
              <Pressable onPress={() => router.push("/(tabs)/activity")}>
                <Text className="text-xs font-semibold text-mint">See all →</Text>
              </Pressable>
            </View>

            {transactions.slice(0, 5).map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
