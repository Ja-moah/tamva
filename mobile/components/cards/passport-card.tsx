import React, { useState } from "react";
import { CheckCircle2, Eye, QrCode, Shield, Sparkles } from "lucide-react-native";
import { Modal, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { BouncyPressable } from "../animated/bouncy-pressable";

interface PassportCardProps {
  name: string;
  country: string;
  memberSince: string;
  status: string;
  onSharePress?: () => void;
}

export function PassportCard({
  name = "Elijah Dery",
  country = "Ghana",
  memberSince = "Jun 2024",
  status = "Active",
  onSharePress,
}: PassportCardProps) {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <>
      <BouncyPressable onPress={() => setShowQrModal(true)}>
        <View
          style={{
            backgroundColor: "#08271e",
            borderColor: "rgba(117, 240, 189, 0.3)",
            borderWidth: 1.5,
          }}
          className="relative overflow-hidden rounded-[28px] p-6 shadow-2xl"
        >
          {/* Africa Continent Vector Art Overlay in Background */}
          <View className="absolute -right-6 -bottom-8 opacity-10">
            <Svg width="220" height="240" viewBox="0 0 100 100">
              <Path
                d="M 50 10 C 60 12, 75 25, 78 40 C 80 55, 65 75, 55 90 C 48 85, 42 70, 38 60 C 30 55, 25 45, 30 30 C 35 20, 42 12, 50 10 Z"
                fill="#75f0bd"
              />
            </Svg>
          </View>

          {/* Top Row: Logo & Status Badge */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-mint/20">
                <Sparkles size={16} color="#75f0bd" />
              </View>
              <Text className="text-xs font-bold tracking-[2.5px] text-mint uppercase">
                TAMVA PASSPORT
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5 rounded-full bg-emeraldPrimary/20 px-3 py-1 border border-emeraldPrimary/30">
              <View className="h-2 w-2 rounded-full bg-emeraldPrimary" />
              <Text className="text-xs font-bold text-emeraldPrimary">{status}</Text>
            </View>
          </View>

          {/* Middle Row: Name, Subtitles and QR Code Box */}
          <View className="mt-6 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-2xl font-extrabold text-white">{name}</Text>
                <CheckCircle2 size={18} color="#00d084" />
              </View>
              <Text className="mt-1 text-xs font-semibold text-emerald-200/80">
                Verified Identity
              </Text>

              <View className="mt-4 gap-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[11px] text-slate-400">Type:</Text>
                  <Text className="text-[11px] font-semibold text-slate-200">Individual</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[11px] text-slate-400">Country:</Text>
                  <Text className="text-[11px] font-semibold text-slate-200">{country}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className="text-[11px] text-slate-400">Member:</Text>
                  <Text className="text-[11px] font-semibold text-slate-200">{memberSince}</Text>
                </View>
              </View>
            </View>

            {/* QR Code Graphic Box */}
            <View className="items-center rounded-2xl border border-white/10 bg-black/40 p-2.5 shadow-md">
              <View className="h-16 w-16 items-center justify-center rounded-xl bg-white p-1">
                <QrCode size={56} color="#07130f" />
              </View>
              <View className="mt-1.5 flex-row items-center gap-1">
                <Eye size={10} color="#75f0bd" />
                <Text className="text-[9px] font-bold text-mint uppercase tracking-wider">
                  Tap to view
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Pillar Tagline */}
          <View className="mt-6 border-t border-emerald-500/20 pt-3 flex-row items-center justify-between">
            <Text className="text-[10px] font-semibold tracking-[2px] text-emerald-300/60 uppercase">
              People • Data • Trust • Opportunity
            </Text>
            <Shield size={12} color="#75f0bd" />
          </View>
        </View>
      </BouncyPressable>

      {/* QR Modal for Inspection */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/80 px-6">
          <View className="w-full max-w-sm rounded-[32px] border border-mint/30 bg-surface p-6 items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-mint/20 mb-3">
              <QrCode size={24} color="#75f0bd" />
            </View>
            <Text className="text-xl font-bold text-white">Verified QR Passport</Text>
            <Text className="mt-1 text-center text-xs text-slate-400">
              Scan to verify financial credentials via Ghana Open Banking / TAMVA Node
            </Text>

            <View className="my-6 rounded-3xl bg-white p-6 shadow-2xl items-center justify-center">
              <QrCode size={180} color="#07130f" />
              <Text className="mt-3 text-[10px] font-mono text-slate-500">
                DID:TAMVA:GHA:2026:ELIJAH:9910
              </Text>
            </View>

            <View className="w-full gap-2.5">
              <BouncyPressable
                onPress={() => {
                  setShowQrModal(false);
                  onSharePress?.();
                }}
                className="w-full items-center justify-center rounded-2xl bg-emeraldPrimary py-3.5 shadow-lg"
              >
                <Text className="text-sm font-bold text-ink">Share Passport Link</Text>
              </BouncyPressable>

              <BouncyPressable
                onPress={() => setShowQrModal(false)}
                className="w-full items-center justify-center rounded-2xl bg-white/10 py-3"
              >
                <Text className="text-sm font-semibold text-slate-300">Close</Text>
              </BouncyPressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
