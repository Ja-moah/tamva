import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Landmark,
  Lightbulb,
  Lock,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet,
  Zap,
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

import { BouncyPressable } from "../components/animated/bouncy-pressable";
import { ConnectedAccount } from "../constants/mock-data";
import { useTamvaStore } from "../store/use-tamva-store";

const PROVIDERS = [
  { name: "MTN MoMo", type: "Mobile Money", color: "#eab308", icon: Smartphone },
  { name: "Telecel Cash", type: "Mobile Money", color: "#ef4444", icon: Smartphone },
  { name: "AirtelTigo", type: "Mobile Money", color: "#dc2626", icon: Smartphone },
  { name: "Zeepay", type: "Fintech", color: "#ea580c", icon: Zap },
  { name: "Stanbic Bank", type: "Bank", color: "#2563eb", icon: Landmark },
  { name: "GCB Bank", type: "Bank", color: "#0284c7", icon: Landmark },
];

const ACCOUNT_CATEGORIES = [
  "All",
  "Banks",
  "Mobile Money",
  "Fintechs",
  "Savings & Investments",
  "Other",
] as const;

export default function ConsentScreen() {
  const { accounts, revokeConsent, connectAccount } = useTamvaStore();

  const [activeTab, setActiveTab] = useState<
    "Accounts" | "Data Sharing" | "Manage Consent" | "Activity"
  >("Accounts");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  const [selectedAccountForRevoke, setSelectedAccountForRevoke] =
    useState<ConnectedAccount | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderType, setNewProviderType] =
    useState<ConnectedAccount["institutionType"]>("Bank");

  const filteredAccounts = accounts.filter((acc) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Banks") return acc.institutionType === "Bank";
    if (selectedFilter === "Mobile Money")
      return acc.institutionType === "Mobile Money";
    if (selectedFilter === "Fintechs") return acc.institutionType === "Fintech";
    if (selectedFilter === "Savings & Investments")
      return acc.institutionType === "Savings";
    return true;
  });

  const handleRevokeConfirm = () => {
    if (selectedAccountForRevoke) {
      revokeConsent(selectedAccountForRevoke.id);
      setSelectedAccountForRevoke(null);
      Alert.alert(
        "Consent Revoked",
        `Access for ${selectedAccountForRevoke.institutionName} has been immediately terminated under Ghana Data Protection Act guidelines.`
      );
    }
  };

  const handleCreateConnection = (
    provider: (typeof PROVIDERS)[0] | { name: string; type: ConnectedAccount["institutionType"] }
  ) => {
    connectAccount(provider.name, provider.type as any);
    setShowConnectModal(false);
    setNewProviderName("");
    Alert.alert(
      "Account Connected",
      `${provider.name} connected successfully with encrypted token exchange.`
    );
  };

  return (
    <View className="flex-1 bg-ink">
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          contentContainerClassName="px-5 pb-36"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header */}
          <View className="flex-row items-center justify-between pt-2">
            <BouncyPressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface"
            >
              <ArrowLeft size={20} color="#ffffff" />
            </BouncyPressable>

            <BouncyPressable className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface">
              <HelpCircle size={18} color="#75f0bd" />
            </BouncyPressable>
          </View>

          {/* Title */}
          <View className="mt-4">
            <Text className="text-2xl font-black text-white">
              Consent & Connected Accounts
            </Text>
            <Text className="mt-0.5 text-xs text-slate-400">
              Your data. Your choice. A more complete you.
            </Text>
          </View>

          {/* Sub Navigation Tabs */}
          <View className="mt-5 flex-row rounded-2xl bg-surface/80 p-1 border border-white/5">
            {(["Accounts", "Data Sharing", "Manage Consent", "Activity"] as const).map(
              (tab) => {
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
              }
            )}
          </View>

          {/* You are in control banner */}
          <View className="mt-5 rounded-2xl border border-emeraldPrimary/30 bg-emerald-950/40 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <ShieldCheck size={18} color="#00d084" />
                <Text className="text-xs font-bold text-white">You are in control</Text>
              </View>
              <Text className="text-xs font-bold text-mint">Learn More →</Text>
            </View>
            <Text className="mt-1.5 text-[11px] leading-4 text-emerald-200/80">
              Connect your accounts securely. You decide what data is shared, with whom, and for how long. Revoke any time.
            </Text>
          </View>

          {/* Connect a New Account Carousel */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-sm font-bold text-white">Connect a New Account</Text>
                <Text className="text-[11px] text-slate-400">
                  Choose a provider to link your account.
                </Text>
              </View>
              <Pressable onPress={() => setShowConnectModal(true)}>
                <Text className="text-xs font-semibold text-mint">View all →</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-5 px-5"
            >
              <View className="flex-row gap-3">
                {PROVIDERS.map((prov) => {
                  const IconComponent = prov.icon;
                  return (
                    <BouncyPressable
                      key={prov.name}
                      onPress={() => handleCreateConnection(prov)}
                      className="w-28 items-center rounded-2xl border border-white/10 bg-surface p-3.5"
                    >
                      <View
                        style={{ backgroundColor: prov.color }}
                        className="h-10 w-10 items-center justify-center rounded-xl shadow-md"
                      >
                        <IconComponent size={20} color="#ffffff" />
                      </View>
                      <Text
                        className="mt-2 text-center text-xs font-bold text-white"
                        numberOfLines={1}
                      >
                        {prov.name}
                      </Text>
                      <Text className="text-[10px] text-slate-400">Link</Text>
                    </BouncyPressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-5 -mx-5 px-5"
          >
            <View className="flex-row gap-2">
              {ACCOUNT_CATEGORIES.map((cat) => {
                const isSelected = selectedFilter === cat;
                return (
                  <BouncyPressable
                    key={cat}
                    onPress={() => setSelectedFilter(cat)}
                    className={`rounded-full px-3.5 py-1.5 ${
                      isSelected
                        ? "bg-mint border border-mint"
                        : "bg-surface border border-white/5"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? "text-ink" : "text-slate-300"
                      }`}
                    >
                      {cat}
                    </Text>
                  </BouncyPressable>
                );
              })}
            </View>
          </ScrollView>

          {/* My Connected Accounts List */}
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-white">My Connected Accounts</Text>
              <Text className="text-xs text-slate-400">
                {filteredAccounts.length} accounts connected
              </Text>
            </View>

            <View className="gap-2.5">
              {filteredAccounts.map((acc) => {
                const isRevoked = acc.status === "REVOKED";
                return (
                  <BouncyPressable
                    key={acc.id}
                    onPress={() => setSelectedAccountForRevoke(acc)}
                  >
                    <View
                      className={`rounded-2xl border border-white/10 bg-surface p-4 flex-row items-center justify-between ${
                        isRevoked ? "opacity-40" : ""
                      }`}
                    >
                      <View className="flex-row items-center gap-3.5 flex-1 pr-2">
                        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                          {acc.institutionType === "Mobile Money" ? (
                            <Smartphone size={20} color="#75f0bd" />
                          ) : acc.institutionType === "Fintech" ? (
                            <Zap size={20} color="#f59e0b" />
                          ) : (
                            <Landmark size={20} color="#00d084" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-white" numberOfLines={1}>
                            {acc.institutionName}
                          </Text>
                          <Text className="text-xs text-slate-400 mt-0.5">
                            {acc.accountType} • {acc.maskedIdentifier}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end gap-1.5">
                        <View
                          className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${
                            isRevoked
                              ? "bg-rose-500/20"
                              : "bg-emeraldPrimary/20 border border-emeraldPrimary/30"
                          }`}
                        >
                          <View
                            className={`h-1.5 w-1.5 rounded-full ${
                              isRevoked ? "bg-rose-400" : "bg-emeraldPrimary"
                            }`}
                          />
                          <Text
                            className={`text-[10px] font-bold ${
                              isRevoked ? "text-rose-400" : "text-emeraldPrimary"
                            }`}
                          >
                            {isRevoked ? "Revoked" : "Connected"}
                          </Text>
                        </View>
                        <Text className="text-[10px] text-slate-500">{acc.lastSyncAt}</Text>
                      </View>
                    </View>
                  </BouncyPressable>
                );
              })}
            </View>
          </View>

          {/* Account Insights Card */}
          <BouncyPressable className="mt-5">
            <View className="flex-row items-center justify-between rounded-2xl border border-mint/20 bg-forest/30 p-4">
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint/20">
                  <Lightbulb size={20} color="#75f0bd" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-mint">Account Insights</Text>
                  <Text className="text-xs font-medium text-white mt-0.5">
                    Your connected accounts give you a clearer picture of your income, spending, savings and more.
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#75f0bd" />
            </View>
          </BouncyPressable>
        </ScrollView>

        {/* Floating Connect Another Account Button */}
        <View className="absolute bottom-6 inset-x-5">
          <BouncyPressable
            onPress={() => setShowConnectModal(true)}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-emeraldPrimary py-4 shadow-xl active:bg-emerald-400"
          >
            <Plus size={18} color="#07130f" strokeWidth={3} />
            <Text className="text-base font-extrabold text-ink">
              Connect Another Account
            </Text>
          </BouncyPressable>
        </View>
      </SafeAreaView>

      {/* Revoke Consent Confirmation Modal Sheet */}
      <Modal
        visible={!!selectedAccountForRevoke}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAccountForRevoke(null)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="rounded-t-[32px] border-t border-white/10 bg-surface p-6">
            <View className="flex-row items-center gap-3 mb-2">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <Lock size={20} color="#f59e0b" />
              </View>
              <Text className="text-lg font-bold text-white">Manage Consent</Text>
            </View>

            {selectedAccountForRevoke && (
              <>
                <Text className="text-sm font-bold text-emeraldPrimary mt-2">
                  {selectedAccountForRevoke.institutionName}
                </Text>
                <Text className="text-xs text-slate-300 mt-1">
                  {selectedAccountForRevoke.accountType} • {selectedAccountForRevoke.maskedIdentifier}
                </Text>

                <View className="my-4 rounded-xl bg-black/40 p-3 gap-1.5 border border-white/5">
                  <Text className="text-xs font-semibold text-slate-400">Granted Scopes:</Text>
                  {selectedAccountForRevoke.scopes.map((s) => (
                    <Text key={s} className="text-xs font-mono text-mint">
                      • {s}
                    </Text>
                  ))}
                  <Text className="text-[10px] text-slate-500 mt-1">
                    Connected on {selectedAccountForRevoke.connectedSince}
                  </Text>
                </View>

                {selectedAccountForRevoke.status !== "REVOKED" ? (
                  <View className="gap-2.5">
                    <BouncyPressable
                      onPress={handleRevokeConfirm}
                      className="flex-row items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3.5 shadow-lg"
                    >
                      <Trash2 size={16} color="#ffffff" />
                      <Text className="text-sm font-bold text-white">
                        Revoke Access Immediately
                      </Text>
                    </BouncyPressable>

                    <BouncyPressable
                      onPress={() => setSelectedAccountForRevoke(null)}
                      className="items-center justify-center rounded-2xl bg-white/5 py-3"
                    >
                      <Text className="text-xs font-semibold text-slate-300">Keep Connected</Text>
                    </BouncyPressable>
                  </View>
                ) : (
                  <View className="items-center py-2">
                    <Text className="text-xs text-rose-400 font-semibold mb-3">
                      Access is currently REVOKED for this account.
                    </Text>
                    <BouncyPressable
                      onPress={() => setSelectedAccountForRevoke(null)}
                      className="w-full items-center justify-center rounded-2xl bg-white/10 py-3"
                    >
                      <Text className="text-xs font-semibold text-white">Close</Text>
                    </BouncyPressable>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Connect New Account Modal */}
      <Modal
        visible={showConnectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConnectModal(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="rounded-t-[32px] border-t border-mint/30 bg-surface p-6">
            <Text className="text-lg font-bold text-white">Connect Financial Institution</Text>
            <Text className="text-xs text-slate-400 mb-4">
              Select or type a provider complying with Ghana Open Banking Directive.
            </Text>

            <View className="gap-2 mb-4">
              {PROVIDERS.slice(0, 4).map((p) => (
                <BouncyPressable
                  key={p.name}
                  onPress={() => handleCreateConnection(p)}
                  className="flex-row items-center justify-between rounded-xl bg-black/40 p-3.5 border border-white/5"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{ backgroundColor: p.color }}
                      className="h-8 w-8 items-center justify-center rounded-lg"
                    >
                      <p.icon size={16} color="#ffffff" />
                    </View>
                    <Text className="text-xs font-bold text-white">{p.name}</Text>
                  </View>
                  <ChevronRight size={14} color="#75f0bd" />
                </BouncyPressable>
              ))}
            </View>

            <BouncyPressable
              onPress={() => setShowConnectModal(false)}
              className="items-center justify-center rounded-xl bg-white/10 py-3"
            >
              <Text className="text-xs font-semibold text-slate-300">Cancel</Text>
            </BouncyPressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
