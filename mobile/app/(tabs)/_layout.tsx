import { Tabs } from "expo-router";
import {
  Activity,
  Home,
  ShieldCheck,
  User,
  WalletCards,
} from "lucide-react-native";
import React from "react";
import { Platform, Text, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#75f0bd",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#07130f",
          borderTopColor: "rgba(117, 240, 189, 0.12)",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) => <Activity color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: "Passport",
          tabBarIcon: ({ color, size }) => <WalletCards color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="protection"
        options={{
          title: "Protection",
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
