import { Tabs } from "expo-router";
import { Wine, PlusCircle, Settings } from "lucide-react-native";

const WINE_RED = "#8B1A1A";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: WINE_RED,
        tabBarInactiveTintColor: "#888",
        headerStyle: { backgroundColor: WINE_RED },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mein Keller",
          tabBarLabel: "Keller",
          tabBarIcon: ({ color, size }) => <Wine size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Wein erfassen",
          tabBarLabel: "Erfassen",
          tabBarIcon: ({ color, size }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Einstellungen",
          tabBarLabel: "Einstellungen",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
