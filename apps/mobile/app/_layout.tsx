import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppRuntimeProvider } from "@/providers/AppRuntimeProvider";
import { WineStoreProvider } from "@/store/useWineStore";

export default function RootLayout() {
  return (
    <AppRuntimeProvider>
      <WineStoreProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="wine/[id]"
              options={{ title: "Weindetail", headerBackTitle: "Keller" }}
            />
          </Stack>
        </SafeAreaProvider>
      </WineStoreProvider>
    </AppRuntimeProvider>
  );
}
