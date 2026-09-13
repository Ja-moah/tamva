import { Tabs } from "expo-router";
import { CircleEllipsis, House, ScrollText, ShieldCheck, WalletCards } from "lucide-react-native";
import { useWindowDimensions } from "react-native";

const tabColor = "#123b2d";

export default function CustomerTabsLayout() {
  const { width } = useWindowDimensions();
  const useSidebar = width >= 768;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tabColor,
        tabBarInactiveTintColor: "#64748b",
        tabBarPosition: useSidebar ? "left" : "bottom",
        tabBarVariant: useSidebar ? "material" : "uikit",
        tabBarLabelPosition: "below-icon",
        tabBarStyle: useSidebar
          ? { width: 184, paddingTop: 24, borderRightColor: "#e2e8f0" }
          : { minHeight: 64, paddingTop: 6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="activity" options={{ title: "Activity", tabBarIcon: ({ color }) => <ScrollText color={color} size={22} /> }} />
      <Tabs.Screen name="passport" options={{ title: "Passport", tabBarIcon: ({ color }) => <WalletCards color={color} size={22} /> }} />
      <Tabs.Screen name="protection" options={{ title: "Protection", tabBarIcon: ({ color }) => <ShieldCheck color={color} size={22} /> }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ color }) => <CircleEllipsis color={color} size={22} /> }} />
    </Tabs>
  );
}
