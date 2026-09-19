import { router } from "expo-router";
import { DEMO_MODE } from '../src/config/env';
import { ConfidenceLive } from '../src/components/live/ConfidenceLive';
import { withFeatureGate } from '../src/components/ui/withFeatureGate';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Info,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";

import { BouncyPressable } from "../components/animated/bouncy-pressable";
import { ProgressBar } from "../components/animated/progress-bar";
import { SCORE_HISTORY, confidencePillars, confidenceUser } from "../src/demo/data/mockConfidenceData";

function ConfidenceScreen() {
  const user = confidenceUser;
  const behavioralPillars = confidencePillars;
  const [activeTab, setActiveTab] = useState<"Overview" | "Breakdown" | "History" | "Tips">("Overview");

  return (
    <View className="flex-1 bg-ink">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerClassName="px-5 pb-24"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back Arrow & Notification Bell */}
          <View className="flex-row items-center justify-between pt-2">
            <BouncyPressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface"
            >
              <ArrowLeft size={20} color="#ffffff" />
            </BouncyPressable>

            <View className="flex-row items-center gap-3">
              <BouncyPressable
                onPress={() => router.push("/notifications")}
                className="relative h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface"
              >
                <Bell size={18} color="#ffffff" />
                <View className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-rose-500 border-2 border-ink">
                  <Text className="text-[9px] font-bold text-white">1</Text>
                </View>
              </BouncyPressable>

              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-forest border border-mint/30">
                <Text className="text-sm font-bold text-mint">{user.initials}</Text>
              </View>
            </View>
          </View>

          {/* Title */}
          <View className="mt-4">
            <Text className="text-2xl font-black text-white">Financial Confidence</Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              Understand your score. Take control of your future.
            </Text>
          </View>

          {/* Sub Navigation Tabs */}
          <View className="mt-5 flex-row rounded-2xl bg-surface/80 p-1 border border-white/5">
            {(["Overview", "Breakdown", "History", "Tips"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 py-2 items-center rounded-xl ${
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

          {/* Score Hero with Interactive 6-Month Trajectory Chart */}
          <View className="mt-5 rounded-[28px] border border-mint/30 bg-surface p-6 shadow-2xl">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs font-semibold text-slate-400">
                  Your Financial Confidence
                </Text>
                <Info size={14} color="#64748b" />
              </View>

              <View className="rounded-full bg-emeraldPrimary/20 px-3 py-1 border border-emeraldPrimary/30">
                <Text className="text-xs font-bold text-emeraldPrimary">
                  {user.scoreRating}
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-baseline gap-2">
              <Text className="text-5xl font-black text-white">
                {user.confidenceScore}
              </Text>
              <Text className="text-base font-bold text-slate-400">/100</Text>
            </View>

            <Text className="mt-1 text-xs font-semibold text-emeraldPrimary">
              ↑ +6 points compared to last month
            </Text>

            {/* 6-Month SVG Trajectory Chart */}
            <View className="mt-6 h-36 w-full">
              <Svg width="100%" height="100%" viewBox="0 0 320 120">
                <Defs>
                  <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#00d084" stopOpacity="0.4" />
                    <Stop offset="100%" stopColor="#00d084" stopOpacity="0.0" />
                  </LinearGradient>
                </Defs>

                {/* Grid Lines */}
                <Path d="M 0 30 L 320 30 M 0 70 L 320 70 M 0 100 L 320 100" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                {/* Gradient Fill under curve */}
                <Path
                  d="M 20 95 C 60 85, 100 80, 140 65 C 180 50, 220 40, 280 18 L 280 110 L 20 110 Z"
                  fill="url(#chartGrad)"
                />

                {/* Score Path */}
                <Path
                  d="M 20 95 C 60 85, 100 80, 140 65 C 180 50, 220 40, 280 18"
                  fill="none"
                  stroke="#00d084"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Current Score Dot */}
                <Circle cx="280" cy="18" r="6" fill="#07130f" stroke="#00d084" strokeWidth="3" />

                {/* Month labels */}
                {SCORE_HISTORY.map((item, idx) => {
                  const x = 20 + idx * 52;
                  return (
                    <SvgText
                      key={item.month}
                      x={x}
                      y="118"
                      fill="#64748b"
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {item.month}
                    </SvgText>
                  );
                })}
              </Svg>
            </View>

            <Text className="mt-2 text-xs text-slate-300">
                You&apos;re on a strong path. Keep it up!
            </Text>
          </View>

          {/* What makes up your score? */}
          <View className="mt-7">
            <Text className="text-base font-bold text-white">What makes up your score?</Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              Your score is based on key areas of your financial behaviour.
            </Text>

            <View className="mt-4 gap-3">
              {behavioralPillars.map((pillar) => (
                <BouncyPressable key={pillar.id}>
                  <View className="rounded-2xl border border-white/5 bg-surface p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View
                          style={{ backgroundColor: `${pillar.color}20` }}
                          className="h-9 w-9 items-center justify-center rounded-xl"
                        >
                          <ShieldCheck size={18} color={pillar.color} />
                        </View>
                        <View>
                          <Text className="text-sm font-bold text-white">{pillar.name}</Text>
                          <Text className="mt-0.5 text-xs text-slate-400">
                            {pillar.description}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-bold text-white">
                          {pillar.score}
                          <Text className="text-xs font-normal text-slate-400">/100</Text>
                        </Text>
                        <ChevronRight size={16} color="#64748b" />
                      </View>
                    </View>

                    <View className="mt-3">
                      <ProgressBar progress={pillar.score} color={pillar.color} height={6} />
                    </View>
                  </View>
                </BouncyPressable>
              ))}
            </View>
          </View>

          {/* Overall Insight Card */}
          <BouncyPressable className="mt-5">
            <View className="flex-row items-center justify-between rounded-2xl border border-mint/20 bg-forest/40 p-4">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint/20">
                  <Lightbulb size={20} color="#75f0bd" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-mint">Overall Insight</Text>
                  <Text className="mt-0.5 text-xs leading-4 text-white">
                    Your financial confidence is good. Continue saving consistently and reduce non-essential spending to reach an excellent score.
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#75f0bd" />
            </View>
          </BouncyPressable>

          {/* Recommended Actions Carousel */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-white">Recommended Actions</Text>
              <Text className="text-xs font-semibold text-mint">See all →</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
              <View className="flex-row gap-3">
                <View className="w-44 rounded-2xl border border-white/10 bg-surface p-4">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20">
                    <Zap size={16} color="#a855f7" />
                  </View>
                  <Text className="mt-3 text-xs font-bold text-white">Increase Savings</Text>
                  <Text className="mt-1 text-[11px] text-slate-400">
                    Boost your savings rate to improve resilience.
                  </Text>
                  <BouncyPressable
                    onPress={() => router.push("/(tabs)/profile")}
                    className="mt-4 rounded-xl bg-mint/10 py-2 items-center border border-mint/30"
                  >
                    <Text className="text-xs font-bold text-mint">Get Started</Text>
                  </BouncyPressable>
                </View>

                <View className="w-44 rounded-2xl border border-white/10 bg-surface p-4">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20">
                    <Wallet size={16} color="#f59e0b" />
                  </View>
                  <Text className="mt-3 text-xs font-bold text-white">Reduce Expenses</Text>
                  <Text className="mt-1 text-[11px] text-slate-400">
                    Lower non-essential spending.
                  </Text>
                  <BouncyPressable
                    onPress={() => router.push("/(tabs)/activity")}
                    className="mt-4 rounded-xl bg-amber-500/10 py-2 items-center border border-amber-500/30"
                  >
                    <Text className="text-xs font-bold text-amber-400">View Tips</Text>
                  </BouncyPressable>
                </View>

                <View className="w-44 rounded-2xl border border-white/10 bg-surface p-4">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20">
                    <TrendingUp size={16} color="#00d084" />
                  </View>
                  <Text className="mt-3 text-xs font-bold text-white">Maintain On-Time</Text>
                  <Text className="mt-1 text-[11px] text-slate-400">
                    Keep up your good repayment record.
                  </Text>
                  <BouncyPressable
                    onPress={() => router.push("/(tabs)/passport")}
                    className="mt-4 rounded-xl bg-emerald-500/10 py-2 items-center border border-emerald-500/30"
                  >
                    <Text className="text-xs font-bold text-emerald-400">Keep Going</Text>
                  </BouncyPressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}


export default DEMO_MODE ? ConfidenceScreen : withFeatureGate(ConfidenceLive, {
  capability: 'customer_financial_confidence',
  wired: true,
  showBack: true,
  title: 'Financial Confidence',
  description: "Your Financial Confidence isn't available from TAMVA yet.",
});
