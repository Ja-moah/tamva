import React from "react";
import {
  Briefcase,
  Car,
  Fuel,
  Landmark,
  PiggyBank,
  ShoppingBag,
  Smartphone,
  TrendingUp,
} from "lucide-react-native";
import { Text, View } from "react-native";
import { Transaction } from "../../constants/mock-data";
import { BouncyPressable } from "../animated/bouncy-pressable";

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const isPositive = transaction.direction === "IN";

  const getIcon = () => {
    switch (transaction.institutionLogo) {
      case "smartphone":
        return <Smartphone size={18} color="#ffffff" />;
      case "shopping-bag":
        return <ShoppingBag size={18} color="#ffffff" />;
      case "shield":
      case "landmark":
        return <Landmark size={18} color="#ffffff" />;
      case "briefcase":
        return <Briefcase size={18} color="#ffffff" />;
      case "car":
        return <Car size={18} color="#ffffff" />;
      case "fuel":
        return <Fuel size={18} color="#ffffff" />;
      case "trending-up":
        return <TrendingUp size={18} color="#ffffff" />;
      default:
        return <PiggyBank size={18} color="#ffffff" />;
    }
  };

  return (
    <BouncyPressable onPress={onPress}>
      <View className="mb-2.5 flex-row items-center justify-between rounded-2xl border border-slate-100/10 bg-surface/80 p-3.5 shadow-sm active:bg-surface">
        <View className="flex-row items-center gap-3.5">
          <View
            style={{ backgroundColor: transaction.institutionColor }}
            className="h-11 w-11 items-center justify-center rounded-2xl shadow-sm"
          >
            {getIcon()}
          </View>
          <View className="max-w-[200px]">
            <Text className="text-sm font-semibold text-white" numberOfLines={1}>
              {transaction.title}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-400" numberOfLines={1}>
              {transaction.description}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text
            className={`text-sm font-bold ${
              isPositive ? "text-emeraldPrimary" : "text-slate-200"
            }`}
          >
            {isPositive ? "+" : "-"} {transaction.currency}{" "}
            {transaction.amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text className="mt-0.5 text-[11px] text-slate-500 font-medium">
            {transaction.timeFormatted}
          </Text>
        </View>
      </View>
    </BouncyPressable>
  );
}
