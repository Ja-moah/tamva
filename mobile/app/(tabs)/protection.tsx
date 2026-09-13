import { router } from "expo-router";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Fingerprint,
  Globe,
  HelpCircle,
  KeyRound,
  Lightbulb,
  Lock,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserCheck,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BouncyPressable } from "../../components/animated/bouncy-pressable";
import { useTamvaStore } from "../../store/use-tamva-store";

const REALTIME_SHIELDS = [
  { id: "fraud", label: "Transactions screened for fraud", status: "Live", badgeColor: "text-mint" },
  { id: "unusual", label: "Unusual activity detection", status: "Live", badgeColor: "text-mint" },
  { id: "device", label: "Identity and device checks", status: "Live", badgeColor: "text-mint" },
  { id: "darkweb", label: "Dark web monitoring", status: "Active", badgeColor: "text-emerald-400" },
  { id: "takeover", label: "Account takeover protection", status: "Active", badgeColor: "text-emerald-400" },
];

export default function ProtectionScreen() {
  const {
    accounts,
    securityAlerts,
    realtimeMonitoringActive,
    toggleMonitoring,
    reportSuspiciousActivity,
  } = useTamvaStore();

  const [activeTab, setActiveTab] = useState<"Overview" | "Alerts" | "Security" | "Privacy" | "Tips">("Overview");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const handleReportSubmit = () => {
    if (!reportTitle.trim()) {
      Alert.alert("Required", "Please describe what suspicious activity you noticed.");
      return;
    }
    reportSuspiciousActivity(reportTitle, reportDetails || "User reported suspicious action.");
    setShowReportModal(false);
    setReportTitle("");
    setReportDetails("");
    Alert.alert(
      "Report Submitted",
      "Thank you. Our fraud intelligence engine and security operations team have received your alert."
    );
  };

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
              <Text className="text-2xl font-black text-white">Financial Protection</Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                Your safety. Our priority.
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <BouncyPressable
                onPress={() => router.push("/notifications")}
                className="relative h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface"
              >
                <Bell size={18} color="#ffffff" />
                <View className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-rose-500 border-2 border-ink">
                  <Text className="text-[9px] font-bold text-white">2</Text>
                </View>
              </BouncyPressable>

              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-forest border border-mint/30">
                <Text className="text-sm font-bold text-mint">ED</Text>
              </View>
            </View>
          </View>

          {/* Sub Navigation Tabs */}
          <View className="mt-5 flex-row rounded-2xl bg-surface/80 p-1 border border-white/5">
            {(["Overview", "Alerts", "Security", "Privacy", "Tips"] as const).map((tab) => {
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

          {/* Main Status Hero Banner */}
          <View className="mt-4 rounded-[28px] border border-emeraldPrimary/30 bg-surface p-5 shadow-xl">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emeraldPrimary/20">
                  <ShieldCheck size={24} color="#00d084" />
                </View>
                <View>
                  <Text className="text-base font-extrabold text-white">
                      You&apos;re Protected
                  </Text>
                  <Text className="text-xs text-emerald-200/80">
                    Your accounts and data are safe.
                  </Text>
                  <Text className="text-[10px] text-slate-500 mt-0.5">
                    Last checked: Today, 10:24 AM
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5 rounded-full bg-emeraldPrimary/20 px-3 py-1 border border-emeraldPrimary/30">
                <View className="h-2 w-2 rounded-full bg-emeraldPrimary" />
                <Text className="text-xs font-bold text-emeraldPrimary">All Clear</Text>
              </View>
            </View>
          </View>

          {/* 4 Metric Stats Grid */}
          <View className="mt-4 flex-row justify-between">
            <View className="w-[23%] rounded-2xl border border-white/5 bg-surface p-3 items-center">
              <Text className="text-lg font-black text-white">{accounts.length}</Text>
              <Text className="text-[10px] text-slate-400 text-center mt-0.5">Accounts</Text>
              <View className="mt-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-emerald-400">Secure</Text>
              </View>
            </View>

            <View className="w-[23%] rounded-2xl border border-white/5 bg-surface p-3 items-center">
              <Text className="text-lg font-black text-white">0</Text>
              <Text className="text-[10px] text-slate-400 text-center mt-0.5">Suspicious</Text>
              <View className="mt-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-emerald-400">All clear</Text>
              </View>
            </View>

            <View className="w-[23%] rounded-2xl border border-white/5 bg-surface p-3 items-center">
              <Text className="text-lg font-black text-white">No</Text>
              <Text className="text-[10px] text-slate-400 text-center mt-0.5">Breaches</Text>
              <View className="mt-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-emerald-400">Secure</Text>
              </View>
            </View>

            <View className="w-[23%] rounded-2xl border border-white/5 bg-surface p-3 items-center">
              <Text className="text-lg font-black text-white">100%</Text>
              <Text className="text-[10px] text-slate-400 text-center mt-0.5">Authorized</Text>
              <View className="mt-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-emerald-400">Protected</Text>
              </View>
            </View>
          </View>

          {/* Real-Time Monitoring Checklist Panel */}
          <View className="mt-5 rounded-[26px] border border-white/10 bg-surface p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-bold text-white">Real-Time Monitoring</Text>
                <Text className="text-[11px] text-slate-400">
                  Continuous fraud checks across all connected accounts.
                </Text>
              </View>

              <BouncyPressable
                onPress={toggleMonitoring}
                className="flex-row items-center gap-1.5 rounded-full bg-emeraldPrimary/20 px-3 py-1 border border-emeraldPrimary/30"
              >
                <View
                  className={`h-2 w-2 rounded-full ${
                    realtimeMonitoringActive ? "bg-emeraldPrimary" : "bg-slate-500"
                  }`}
                />
                <Text className="text-xs font-bold text-emeraldPrimary">
                  {realtimeMonitoringActive ? "Active" : "Paused"}
                </Text>
              </BouncyPressable>
            </View>

            <View className="mt-4 gap-3">
              {REALTIME_SHIELDS.map((shield) => (
                <View
                  key={shield.id}
                  className="flex-row items-center justify-between border-b border-white/5 pb-2.5 last:border-0 last:pb-0"
                >
                  <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-emeraldPrimary/20">
                      <Check size={14} color="#00d084" strokeWidth={3} />
                    </View>
                    <Text className="text-xs font-medium text-slate-200">
                      {shield.label}
                    </Text>
                  </View>
                  <Text className={`text-xs font-bold ${shield.badgeColor}`}>
                    {shield.status}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Security Alerts */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-white">Recent Alerts</Text>
              <Text className="text-xs font-semibold text-mint">See all →</Text>
            </View>

            <View className="gap-2.5">
              {securityAlerts.map((alert) => {
                const isWarning = alert.type === "WARNING";
                return (
                  <BouncyPressable key={alert.id}>
                    <View className="rounded-2xl border border-white/5 bg-surface p-4 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1 pr-2">
                        <View
                          className={`h-10 w-10 items-center justify-center rounded-xl ${
                            isWarning ? "bg-amber-500/20" : "bg-emerald-500/20"
                          }`}
                        >
                          {isWarning ? (
                            <AlertTriangle size={20} color="#f59e0b" />
                          ) : (
                            <CheckCircle2 size={20} color="#00d084" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs font-bold text-white" numberOfLines={1}>
                            {alert.title}
                          </Text>
                          <Text className="mt-0.5 text-[11px] text-slate-400" numberOfLines={1}>
                            {alert.description}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <Text className="text-[10px] text-slate-500 font-medium">
                          {alert.dateFormatted}
                        </Text>
                        <ChevronRight size={14} color="#64748b" className="mt-1" />
                      </View>
                    </View>
                  </BouncyPressable>
                );
              })}
            </View>
          </View>

          {/* Stay One Step Ahead Tip */}
          <BouncyPressable className="mt-5">
            <View className="flex-row items-center justify-between rounded-2xl border border-mint/20 bg-forest/40 p-4">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint/20">
                  <Lightbulb size={20} color="#75f0bd" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-mint">Stay One Step Ahead</Text>
                  <Text className="mt-0.5 text-xs text-white">
                    Enable two-factor authentication and keep your information up to date for stronger protection.
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#75f0bd" />
            </View>
          </BouncyPressable>

          {/* Danger Button: Report a Suspicious Activity */}
          <View className="mt-7">
            <BouncyPressable
              onPress={() => setShowReportModal(true)}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-rose-500/90 py-4 shadow-xl active:bg-rose-600"
            >
              <AlertTriangle size={18} color="#ffffff" />
              <Text className="text-sm font-bold text-white">
                Report a Suspicious Activity →
              </Text>
            </BouncyPressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Report Suspicious Activity Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="rounded-t-[32px] border-t border-rose-500/30 bg-surface p-6">
            <View className="flex-row items-center gap-3 mb-2">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                <ShieldAlert size={20} color="#f43f5e" />
              </View>
              <Text className="text-lg font-bold text-white">Report Suspicious Activity</Text>
            </View>
            <Text className="text-xs text-slate-400 mb-4">
              Your report is prioritized by the TAMVA Case Operations and Fraud Intelligence Console.
            </Text>

            <View className="gap-3 mb-6">
              <View>
                <Text className="text-xs font-semibold text-slate-300 mb-1.5">
                  Subject / Summary
                </Text>
                <TextInput
                  placeholder="e.g. Unrecognized transfer or login"
                  placeholderTextColor="#64748b"
                  value={reportTitle}
                  onChangeText={setReportTitle}
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-300 mb-1.5">
                  Additional Details
                </Text>
                <TextInput
                  placeholder="Provide transaction IDs, approximate time, or device..."
                  placeholderTextColor="#64748b"
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  multiline
                  numberOfLines={3}
                  className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-sm text-white h-20"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <BouncyPressable
                onPress={() => setShowReportModal(false)}
                className="flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 py-3.5"
              >
                <Text className="text-xs font-bold text-slate-300">Cancel</Text>
              </BouncyPressable>

              <BouncyPressable
                onPress={handleReportSubmit}
                className="flex-1 items-center justify-center rounded-xl bg-rose-500 py-3.5 shadow-lg"
              >
                <Text className="text-xs font-bold text-white">Submit Case</Text>
              </BouncyPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
