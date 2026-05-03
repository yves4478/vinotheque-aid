import { createRuntimeConfig, normalizeEnvironment, type AppEnvironment } from "@vinotheque/core";

export const MOBILE_ENVIRONMENT: AppEnvironment = normalizeEnvironment(
  process.env.EXPO_PUBLIC_APP_ENV as string | undefined,
  __DEV__ ? "dev" : "prod",
);

export function createInitialRuntimeConfig() {
  return createRuntimeConfig({ environment: MOBILE_ENVIRONMENT });
}
