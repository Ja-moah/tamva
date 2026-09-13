import { router } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  Home,
  Landmark,
  MoreHorizontal,
  Send,
  ShieldCheck,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BouncyPressable } from "../components/animated/bouncy-pressable";
import { VERIFIED_INSTITUTIONS } from "../constants/mock-data";
import { useTamvaStore } from "../store/use-tamva-store";

const PURPOSES = [
  { id: "Business Loan", label: "Business Loan", icon: Briefcase },
  { id: "Personal Loan", label: "Personal Loan", icon: User },
  { id: "Rent / Housing", label: "Rent / Housing", icon: Home },
  { id: "Other", label: "Other", icon: MoreHorizontal },
] as const;

const DATA_CATEGORIES = [
  { id: "income", label: "Income & Cash Flow", sub: "Last 12 months" },
  { id: "balances", label: "Account Balances", sub: "Current balances across accounts" },
  { id: "transactions", label: "Transactions", sub: "Last 12 months" },
  { id: "savings", label: "Savings History", sub: "Last 24 months" },
  { id: "repayment", label: "Repayment Behaviour", sub: "Loan and credit payments" },
  { id: "debt", label: "Debt Information", sub: "Outstanding debts" },
];

export default function PassportCreateScreen() {
  const { passportDraft, updatePassportDraft, submitPassportShare } = useTamvaStore();

  const [purpose, setPurpose] = useState(passportDraft.purpose);
  const [selectedData, setSelectedData] = useState<string[]>(passportDraft.selectedData);
  const [recipient, setRecipient] = useState(VERIFIED_INSTITUTIONS[0]);
  const [durationDays, setDurationDays] = useState(passportDraft.durationDays);
  const [isReady, setIsReady] = useState(false);

  const toggleCategory = (id: string) => {
    if (selectedData.includes(id)) {
      setSelectedData(selectedData.filter((item) => item !== id));
    } else {
      setSelectedData([...selectedData, id]);
    }
  };

  const selectAll = () => {
    if (selectedData.length === DATA_CATEGORIES.length) {
      setSelectedData([]);
    } else {
      setSelectedData(DATA_CATEGORIES.map((c) => c.id));
    }
  };

  const handleReview = () => {
    if (selectedData.length === 0) {
      Alert.alert("Data Selection", "Please select at least one data category to share.");
      return;
    }
    updatePassportDraft({
      purpose,
      selectedData,
      recipientId: recipient.id,
      recipientName: recipient.name,
      durationDays,
    });
    setIsReady(true);
  };

  const handleShareSecurely = () => {
    const newShare = submitPassportShare();
    Alert.alert(
      "Passport Shared Successfully",
      `Encrypted token generated for ${newShare.recipientName} valid for ${durationDays} days.`,
      [{ text: "Done", onPress: () => router.back() }]
    );
  };

  return (
    <View className="flex-1 bg-ink">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerClassName="px-5 pb-36"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          <View className="flex-row items-center justify-between pt-2">
            <BouncyPressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface"
            >
              <ArrowLeft size={20} color="#ffffff" />
            </BouncyPressable>

            <View className="items-center">
              <Text className="text-xs font-bold tracking-[2px] text-mint uppercase">
                TAMVA
              </Text>
              <Text className="text-[11px] text-slate-400">Financial Passport</Text>
            </View>

            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-forest border border-mint/30">
              <Text className="text-xs font-bold text-mint">ED</Text>
            </View>
          </View>

          {/* Title & Description */}
          <View className="mt-4">
            <Text className="text-2xl font-black text-white">Create Financial Passport</Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              Choose what to share, who can receive it, and how long.
            </Text>
          </View>

          {/* 4-Step Indicator Bar */}
          <View className="mt-5 flex-row items-center justify-between px-2">
            <View className="items-center gap-1">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-emeraldPrimary">
                <Text className="text-xs font-bold text-ink">1</Text>
              </View>
              <Text className="text-[10px] font-bold text-emeraldPrimary">Purpose</Text>
            </View>
            <View className="h-0.5 flex-1 bg-emeraldPrimary mx-2 -mt-3" />

            <View className="items-center gap-1">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-emeraldPrimary">
                <Text className="text-xs font-bold text-ink">2</Text>
              </View>
              <Text className="text-[10px] font-bold text-emeraldPrimary">Data</Text>
            </View>
            <View className="h-0.5 flex-1 bg-emeraldPrimary mx-2 -mt-3" />

            <View className="items-center gap-1">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-emeraldPrimary">
                <Text className="text-xs font-bold text-ink">3</Text>
              </View>
              <Text className="text-[10px] font-bold text-emeraldPrimary">Recipient</Text>
            </View>
            <View className="h-0.5 flex-1 bg-emeraldPrimary mx-2 -mt-3" />

            <View className="items-center gap-1">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-emeraldPrimary">
                <Text className="text-xs font-bold text-ink">4</Text>
              </View>
              <Text className="text-[10px] font-bold text-emeraldPrimary">Duration</Text>
            </View>
          </View>

          {/* Step 1: Purpose Selection */}
          <View className="mt-7 rounded-[26px] border border-white/10 bg-surface p-5">
            <Text className="text-sm font-bold text-white">1. What is the purpose?</Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              Select the main reason for sharing your financial passport.
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-2.5">
              {PURPOSES.map((item) => {
                const isSelected = purpose === item.id;
                const IconComponent = item.icon;
                return (
                  <BouncyPressable
                    key={item.id}
                    onPress={() => setPurpose(item.id)}
                    className={`w-[48%] rounded-2xl p-3.5 border ${
                      isSelected
                        ? "border-emeraldPrimary bg-emerald-950/60"
                        : "border-white/5 bg-black/30"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <IconComponent
                        size={18}
                        color={isSelected ? "#00d084" : "#94a3b8"}
                      />
                      {isSelected && <CheckCircle2 size={16} color="#00d084" />}
                    </View>
                    <Text
                      className={`mt-2 text-xs font-bold ${
                        isSelected ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </BouncyPressable>
                );
              })}
            </View>
          </View>

          {/* Step 2: What Data to Share */}
          <View className="mt-4 rounded-[26px] border border-white/10 bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <View className="max-w-[220px]">
                <Text className="text-sm font-bold text-white">
                  2. What data do you want to share?
                </Text>
                <Text className="mt-0.5 text-xs text-slate-400">
                  You can select or deselect specific data to share.
                </Text>
              </View>

              <Pressable onPress={selectAll}>
                <Text className="text-xs font-semibold text-mint">
                  {selectedData.length === DATA_CATEGORIES.length ? "Deselect all" : "Select all"}
                </Text>
              </Pressable>
            </View>

            <View className="mt-4 gap-2.5">
              {DATA_CATEGORIES.map((cat) => {
                const isChecked = selectedData.includes(cat.id);
                return (
                  <BouncyPressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    className="flex-row items-center justify-between rounded-xl bg-black/30 p-3 border border-white/5"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-xs font-bold text-white">{cat.label}</Text>
                      <Text className="mt-0.5 text-[11px] text-slate-400">{cat.sub}</Text>
                    </View>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-lg border ${
                        isChecked
                          ? "bg-emeraldPrimary border-emeraldPrimary"
                          : "border-slate-600 bg-transparent"
                      }`}
                    >
                      {isChecked && <Check size={14} color="#07130f" strokeWidth={3} />}
                    </View>
                  </BouncyPressable>
                );
              })}
            </View>
          </View>

          {/* Step 3: Recipient Institution */}
          <View className="mt-4 rounded-[26px] border border-white/10 bg-surface p-5">
            <Text className="text-sm font-bold text-white">
              3. Who do you want to share with?
            </Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              Search for and select a verified institution.
            </Text>

            <View className="mt-3 gap-2">
              {VERIFIED_INSTITUTIONS.slice(0, 3).map((inst) => {
                const isSelected = recipient.id === inst.id;
                return (
                  <BouncyPressable
                    key={inst.id}
                    onPress={() => setRecipient(inst)}
                    className={`flex-row items-center justify-between rounded-xl p-3.5 border ${
                      isSelected
                        ? "bg-emerald-950/60 border-emeraldPrimary"
                        : "bg-black/30 border-white/5"
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-mint/10">
                        <Landmark size={18} color="#75f0bd" />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-white">{inst.name}</Text>
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <CheckCircle2 size={10} color="#00d084" />
                          <Text className="text-[10px] font-semibold text-emerald-400">
                            Verified Institution
                          </Text>
                        </View>
                      </View>
                    </View>

                    {isSelected && <CheckCircle2 size={18} color="#00d084" />}
                  </BouncyPressable>
                );
              })}
            </View>
          </View>

          {/* Step 4: Duration Selection */}
          <View className="mt-4 rounded-[26px] border border-white/10 bg-surface p-5">
            <Text className="text-sm font-bold text-white">
              4. How long should they have access?
            </Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              You can revoke access at any time.
            </Text>

            <View className="mt-3 flex-row gap-2.5">
              {[14, 30, 90].map((days) => {
                const isSelected = durationDays === days;
                return (
                  <BouncyPressable
                    key={days}
                    onPress={() => setDurationDays(days)}
                    className={`flex-1 items-center justify-center rounded-xl py-3 border ${
                      isSelected
                        ? "bg-emeraldPrimary border-emeraldPrimary"
                        : "bg-black/30 border-white/5"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-ink" : "text-slate-300"
                      }`}
                    >
                      {days} days
                    </Text>
                  </BouncyPressable>
                );
              })}
            </View>
          </View>

          {/* Privacy Guarantee Card */}
          <View className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-4">
            <View className="flex-row items-center gap-2.5">
              <ShieldCheck size={18} color="#00d084" />
              <Text className="text-xs font-bold text-white">You are in control.</Text>
            </View>
            <Text className="mt-1 text-[11px] leading-4 text-emerald-200/80">
              You decide what data is shared, who can access it, and for how long. You can revoke access at any time. Your data is encrypted and shared only with verified institutions.
            </Text>
          </View>

          {/* Review / Action Buttons */}
          <View className="mt-6 flex-row gap-3">
            <BouncyPressable
              onPress={() => router.back()}
              className="flex-1 items-center justify-center rounded-2xl border border-white/10 bg-surface py-3.5"
            >
              <Text className="text-sm font-semibold text-slate-300">Cancel</Text>
            </BouncyPressable>

            <BouncyPressable
              onPress={handleReview}
              className="flex-1 items-center justify-center rounded-2xl bg-emeraldPrimary py-3.5 shadow-lg"
            >
              <Text className="text-sm font-bold text-ink">Review Passport →</Text>
            </BouncyPressable>
          </View>

          {/* Ready to share Card Drawer (when reviewed) */}
          {isReady && (
            <View className="mt-6 rounded-[28px] border-2 border-emeraldPrimary bg-surface p-5 shadow-2xl">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emeraldPrimary">
                  <Check size={20} color="#07130f" strokeWidth={3} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-extrabold text-white">Ready to share</Text>
                  <Text className="text-[11px] text-slate-400">
                    Your financial passport is ready. Review details below.
                  </Text>
                </View>
              </View>

              <View className="mt-4 rounded-xl bg-black/40 p-3.5 gap-2 border border-white/5">
                <View className="flex-row justify-between">
                  <Text className="text-[11px] text-slate-400">Recipient:</Text>
                  <Text className="text-[11px] font-bold text-white">{recipient.name}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-[11px] text-slate-400">Purpose:</Text>
                  <Text className="text-[11px] font-bold text-white">{purpose}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-[11px] text-slate-400">Duration:</Text>
                  <Text className="text-[11px] font-bold text-mint">{durationDays} days access</Text>
                </View>
              </View>

              <BouncyPressable
                onPress={handleShareSecurely}
                className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-emeraldPrimary py-4 shadow-xl"
              >
                <Send size={18} color="#07130f" strokeWidth={2.5} />
                <Text className="text-sm font-extrabold text-ink">Share Securely</Text>
              </BouncyPressable>

              <Text className="mt-2 text-center text-[10px] font-semibold text-slate-500">
                Secure. Private. On your terms.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
