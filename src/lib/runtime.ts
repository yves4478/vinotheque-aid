import { createRuntimeConfig, normalizeEnvironment, type AppEnvironment } from "@vinotheque/core";
import { API_BASE_URL } from "./apiBaseUrl";

export const WEB_ENVIRONMENT: AppEnvironment = normalizeEnvironment(
  import.meta.env.VITE_APP_ENV as string | undefined,
  import.meta.env.DEV ? "dev" : "prod",
);

export function isPwaDisplayMode(): boolean {
  if (typeof window === "undefined") return false;

  const standaloneMatch = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const navigatorStandalone = "standalone" in window.navigator
    ? Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
    : false;

  return standaloneMatch || navigatorStandalone;
}

export function createInitialRuntimeConfig() {
  return createRuntimeConfig({ environment: WEB_ENVIRONMENT });
}

export { API_BASE_URL };
