import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FeatureKey, RuntimeConfig } from "@vinotheque/core";
import { api } from "@/lib/apiClient";
import { createInitialRuntimeConfig, isPwaDisplayMode } from "@/lib/runtime";

type ClientSurface = "web" | "pwa";

interface AppRuntimeContextValue extends RuntimeConfig {
  surface: ClientSurface;
  isDevEnvironment: boolean;
  isFeatureEnabled: (featureKey: FeatureKey) => boolean;
  refreshRuntimeConfig: () => Promise<RuntimeConfig>;
  updateFeatureFlag: (featureKey: FeatureKey, enabled: boolean) => Promise<RuntimeConfig>;
}

const AppRuntimeContext = createContext<AppRuntimeContextValue | null>(null);

export function AppRuntimeProvider({ children }: { children: ReactNode }) {
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig>(() => createInitialRuntimeConfig());
  const surface = isPwaDisplayMode() ? "pwa" : "web";

  const refreshRuntimeConfig = useCallback(async () => {
    const config = await api.config.runtime();
    setRuntimeConfig(config);
    return config;
  }, []);

  const updateFeatureFlag = useCallback(async (featureKey: FeatureKey, enabled: boolean) => {
    const config = await api.config.updateRuntime({ [featureKey]: enabled });
    setRuntimeConfig(config);
    return config;
  }, []);

  useEffect(() => {
    refreshRuntimeConfig().catch(() => {});

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        refreshRuntimeConfig().catch(() => {});
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [refreshRuntimeConfig]);

  const value = useMemo<AppRuntimeContextValue>(() => ({
    ...runtimeConfig,
    surface,
    isDevEnvironment: runtimeConfig.environment === "dev",
    isFeatureEnabled: (featureKey) => runtimeConfig.featureFlags[featureKey],
    refreshRuntimeConfig,
    updateFeatureFlag,
  }), [refreshRuntimeConfig, runtimeConfig, surface, updateFeatureFlag]);

  return (
    <AppRuntimeContext.Provider value={value}>
      {children}
    </AppRuntimeContext.Provider>
  );
}

export function useAppRuntime() {
  const context = useContext(AppRuntimeContext);
  if (!context) {
    throw new Error("useAppRuntime must be used within AppRuntimeProvider");
  }

  return context;
}
