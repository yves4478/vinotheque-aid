import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FeatureFlags, FeatureKey, RuntimeConfig, RuntimeFeatureState } from "@vinotheque/core";
import { api } from "@/lib/apiClient";
import { createInitialRuntimeConfig, isPwaDisplayMode, WEB_ENVIRONMENT } from "@/lib/runtime";

type ClientSurface = "web" | "pwa";

interface AppRuntimeContextValue extends RuntimeConfig {
  surface: ClientSurface;
  isDevEnvironment: boolean;
  isFeatureEnabled: (featureKey: FeatureKey) => boolean;
  refreshRuntimeConfig: () => Promise<RuntimeConfig>;
  updateFeatureFlag: (featureKey: FeatureKey, enabled: boolean) => Promise<RuntimeConfig>;
}

const AppRuntimeContext = createContext<AppRuntimeContextValue | null>(null);

const FEATURE_FLAG_OVERRIDE_KEY = `vinotheque_${WEB_ENVIRONMENT}_feature_overrides`;

function readLocalOverrides(): Partial<FeatureFlags> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(FEATURE_FLAG_OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalOverrides(overrides: Partial<FeatureFlags>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FEATURE_FLAG_OVERRIDE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore quota / privacy errors
  }
}

function applyOverrides(config: RuntimeConfig, overrides: Partial<FeatureFlags>): RuntimeConfig {
  const featureFlags = { ...config.featureFlags } as FeatureFlags;
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === "boolean") {
      featureFlags[key as FeatureKey] = value;
    }
  }
  const features: RuntimeFeatureState[] = config.features.map((feature) => ({
    ...feature,
    enabled: featureFlags[feature.key],
  }));
  return { ...config, featureFlags, features };
}

export function AppRuntimeProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Partial<FeatureFlags>>(() => readLocalOverrides());
  const [baseConfig, setBaseConfig] = useState<RuntimeConfig>(() => createInitialRuntimeConfig());
  const [surface] = useState<ClientSurface>(() => isPwaDisplayMode() ? "pwa" : "web");

  const refreshRuntimeConfig = useCallback(async () => {
    try {
      const config = await api.config.runtime();
      setBaseConfig(config);
      return applyOverrides(config, readLocalOverrides());
    } catch {
      return applyOverrides(baseConfig, readLocalOverrides());
    }
  }, [baseConfig]);

  const updateFeatureFlag = useCallback(async (featureKey: FeatureKey, enabled: boolean) => {
    const nextOverrides: Partial<FeatureFlags> = { ...readLocalOverrides(), [featureKey]: enabled };
    writeLocalOverrides(nextOverrides);
    setOverrides(nextOverrides);

    api.config.updateRuntime({ [featureKey]: enabled }).then((config) => {
      setBaseConfig(config);
    }).catch(() => {
      // backend unreachable — local override stays in effect
    });

    return applyOverrides(baseConfig, nextOverrides);
  }, [baseConfig]);

  useEffect(() => {
    refreshRuntimeConfig().catch(() => {});

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshRuntimeConfig().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshRuntimeConfig]);

  const runtimeConfig = useMemo(() => applyOverrides(baseConfig, overrides), [baseConfig, overrides]);

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
