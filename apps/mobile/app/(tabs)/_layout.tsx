import { Tabs } from "expo-router";
import { getEnabledMobileTabs } from "@/lib/features";
import { useAppRuntime } from "@/providers/AppRuntimeProvider";

const WINE_RED = "#8B1A1A";

export default function TabLayout() {
  const { featureFlags } = useAppRuntime();
  const tabs = getEnabledMobileTabs(featureFlags);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: WINE_RED,
        tabBarInactiveTintColor: "#888",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        headerStyle: { backgroundColor: WINE_RED },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarLabel: tab.tabBarLabel,
            tabBarIcon: ({ color, size }) => <tab.icon size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
