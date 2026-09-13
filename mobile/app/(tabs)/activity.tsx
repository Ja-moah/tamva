import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BouncyPressable } from "../../components/animated/bouncy-pressable";
import { Sparkline } from "../../components/animated/sparkline";
import { TransactionRow } from "../../components/cards/transaction-row";
import { useTamvaStore } from "../../store/use-tamva-store";

const CATEGORIES = ["All", "Income", "Transfers", "Payments", "Savings"] as const;

export default function ActivityScreen() {
  const { transactions, user } = useTamvaStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTransactions = transactions.filter((tx) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (selectedCategory === "Income" && tx.category === "INCOME") ||
      (selectedCategory === "Transfers" && tx.category === "TRANSFER") ||
      (selectedCategory === "Payments" && tx.category === "EXPENSE") ||
      (selectedCategory === "Savings" && tx.category === "SAVING");

    const matchesSearch =
      searchQuery.trim() === "" ||
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.institution.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const todayTxs = filteredTransactions.filter((tx) => tx.dateGroup === "Today");
  const yesterdayTxs = filteredTransactions.filter((tx) => tx.dateGroup === "Yesterday");
  const earlierTxs = filteredTransactions.filter((tx) => tx.dateGroup === "Earlier");

  return (
    <View className="flex-1 bg-ink">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerClassName="px-5 pb-28"
          showsVerticalScrollIndicator={false}
        >
          {/* Screen Title & Filter Button */}
          <View className="flex-row items-center justify-between pt-2">
            <View>
              <Text className="text-2xl font-black text-white">Financial Activity</Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                Your unified financial history
              </Text>
            </View>

            <BouncyPressable className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface">
              <SlidersHorizontal size={18} color="#75f0bd" />
            </BouncyPressable>
          </View>

          {/* Search Bar */}
          <View className="mt-5 flex-row items-center rounded-2xl border border-white/10 bg-surface px-4 py-3">
            <Search size={18} color="#64748b" />
            <TextInput
              placeholder="Search transactions, beneficiaries..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="ml-3 flex-1 text-sm font-medium text-white"
            />
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4 -mx-5 px-5"
          >
            <View className="flex-row gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <BouncyPressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-2 ${
                      isActive
                        ? "bg-mint border border-mint"
                        : "bg-surface border border-white/5"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isActive ? "text-ink" : "text-slate-300"
                      }`}
                    >
                      {cat}
                    </Text>
                  </BouncyPressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Month Summary Selector Card */}
          <View className="mt-5 rounded-[26px] border border-white/10 bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm font-bold text-white">This month</Text>
                <ChevronDown size={14} color="#75f0bd" />
              </View>
              <Text className="text-xs font-semibold text-slate-400">
                1 – 30 Jun 2026
              </Text>
            </View>

            <View className="mt-4 flex-row justify-between border-t border-white/5 pt-4">
              <View>
                <Text className="text-[11px] text-slate-400 font-medium">Inflow</Text>
                <Text className="mt-0.5 text-sm font-bold text-emeraldPrimary">
                  GH₵ {user.monthlyInflow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View>
                <Text className="text-[11px] text-slate-400 font-medium">Outflow</Text>
                <Text className="mt-0.5 text-sm font-bold text-amber-400">
                  GH₵ {user.monthlyOutflow.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[11px] text-slate-400 font-medium">Net</Text>
                <Text className="mt-0.5 text-sm font-bold text-mint">
                  + GH₵ {user.monthlyNet.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          {/* Consistency Insight Card */}
          <BouncyPressable className="mt-3.5">
            <View className="flex-row items-center justify-between rounded-2xl border border-emeraldPrimary/20 bg-emerald-950/40 p-4">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-emeraldPrimary/20">
                  <TrendingUp size={18} color="#00d084" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-white">
                    Your financial activity is becoming more consistent.
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-emerald-300/80">
                    + 24% higher inflow than last month.
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#75f0bd" />
            </View>
          </BouncyPressable>

          {/* Grouped Date Activity Lists */}
          {todayTxs.length > 0 && (
            <View className="mt-6">
              <View className="flex-row items-center justify-between mb-2.5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Today
                </Text>
                <Text className="text-[11px] text-slate-500 font-medium">
                  Tue, 14 Jun 2026
                </Text>
              </View>
              {todayTxs.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </View>
          )}

          {yesterdayTxs.length > 0 && (
            <View className="mt-5">
              <View className="flex-row items-center justify-between mb-2.5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Yesterday
                </Text>
                <Text className="text-[11px] text-slate-500 font-medium">
                  Mon, 13 Jun 2026
                </Text>
              </View>
              {yesterdayTxs.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </View>
          )}

          {earlierTxs.length > 0 && (
            <View className="mt-5">
              <View className="flex-row items-center justify-between mb-2.5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Earlier
                </Text>
                <Text className="text-[11px] text-slate-500 font-medium">
                  Sun, 12 Jun 2026
                </Text>
              </View>
              {earlierTxs.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
