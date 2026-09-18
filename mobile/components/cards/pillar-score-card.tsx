import React from "react";
import { ChevronRight, ShieldCheck, TrendingUp, Wallet, Zap } from "lucide-react-native";
import { Text, View } from "react-native";
import { BehavioralPillar } from "../../constants/mock-data";
import { BouncyPressable } from "../animated/bouncy-pressable";

interface PillarScoreCardProps {
  pillar: BehavioralPillar;
  onPress?: () => void;
}

export function PillarScoreCard({ pillar, onPress }: PillarScoreCardProps) {
  const getBadgeBg = (status: BehavioralPillar["status"]) => {
    switch (status) {
      case "Excellent":
      case "Strong":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Stable":
      case "Good":
        return "bg-teal-500/20 text-teal-300 border-teal-500/30";
      case "Moderate":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  const getPillarIcon = () => {
    switch (pillar.id) {
      case "income":
        return <Wallet size={16} color={pillar.color} />;
      case "cashflow":
        return <TrendingUp size={16} color={pillar.color} />;
      case "savings":
        return <Zap size={16} color={pillar.color} />;
      default:
        return <ShieldCheck size={16} color={pillar.color} />;
    }
  };

  return (
    <BouncyPressable onPress={onPress} className="flex-1 min-w-[46%]">
      <View className="rounded-2xl border border-slate-100/10 bg-surface/90 p-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-white/5">
            {getPillarIcon()}
          </View>
          <View
            className={`rounded-full border px-2.5 py-0.5 ${getBadgeBg(pillar.status)}`}
          >
            <Text className="text-[11px] font-semibold">{pillar.status}</Text>
          </View>
        </View>

        <View className="mt-3">
          <Text className="text-xs font-medium text-slate-400">{pillar.name}</Text>
          <View className="mt-1 flex-row items-baseline gap-1">
            <Text className="text-2xl font-bold text-white">{pillar.score}</Text>
            <Text className="text-xs font-semibold text-slate-500">/100</Text>
          </View>
        </View>

        <Text className="mt-2 text-[11px] leading-4 text-slate-400" numberOfLines={2}>
          {pillar.description}
        </Text>
      </View>
    </BouncyPressable>
  );
}
