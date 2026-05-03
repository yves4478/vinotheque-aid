import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import type { FeatureKey, RuntimeConfig } from "@vinotheque/core";
import { api } from "@/lib/apiClient";
import { createInitialRuntimeConfig } from "@/lib/runtime";

interface AppRuntimeContextValue extends RuntimeConfig {
  surface: "ios";
  isDevEnvironment: boolean;
  isFeatureEnabled: (featureKey: FeatureKey) => boolean;
}

const AppRuntimeContext = createContext<AppRuntimeContextValue | null>(null);

export function AppRuntimeProvider({ children }: { children: ReactNode }) {
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig>(() => createInitialRuntimeConfig());

  const refreshRuntimeConfig = useCallback(async () => {
    const config = await api.config.runtime();
    setRuntimeConfig(config);
    return config;
  }, []);

  useEffect(() => {
    refreshRuntimeConfig().catch(() => {});

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshRuntimeConfig().catch(() => {});
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshRuntimeConfig]);

  const value = useMemo<AppRuntimeContextValue>(() => ({
    ...runtimeConfig,
    surface: "ios",
    isDevEnvironment: runtimeConfig.environment === "dev",
    isFeatureEnabled: (featureKey) => runtimeConfig.featureFlags[featureKey],
  }), [runtimeConfig]);

  return (
    <AppRuntimeContext.Provider value={value}>
      {children}
    </AppRuntimeContext.Provider>
  );
}

export function useAppRuntime() {
  const context = useContext(AppRuntimeContext);
  if (!context) {
    throw new Error("useAppRuntime must be used inside AppRuntimeProvider");
  }

  return context;
}
