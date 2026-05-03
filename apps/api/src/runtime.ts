import type { MiddlewareHandler } from "hono";
import prisma from "./db";

type AppEnvironment = "dev" | "prod";

type FeatureKey =
  | "inventory"
  | "wishlist"
  | "shopping"
  | "map"
  | "suggestions"
  | "merchants"
  | "ratings"
  | "invoiceImport";

interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  description: string;
  surfaces: {
    ios: boolean;
    pwa: boolean;
    web: boolean;
    backend: boolean;
  };
  defaultEnabled: boolean;
}

interface RuntimeConfig {
  environment: AppEnvironment;
  featureFlags: Record<FeatureKey, boolean>;
  features: Array<FeatureDefinition & { enabled: boolean; isEndToEnd: boolean }>;
  generatedAt: string;
}

type FeatureFlagPatch = Partial<Record<FeatureKey, boolean>>;

const FEATURE_DEFINITIONS: Record<FeatureKey, FeatureDefinition> = {
  inventory: {
    key: "inventory",
    label: "Keller & Erfassung",
    description: "Dashboard, Keller, Erfassen und Degustationsfluss mit Backend-Sync.",
    surfaces: { ios: true, pwa: true, web: true, backend: true },
    defaultEnabled: true,
  },
  wishlist: {
    key: "wishlist",
    label: "Merkliste",
    description: "Gemeinsame Wunsch- und Erinnerungslisten mit Backend-Sync.",
    surfaces: { ios: true, pwa: true, web: true, backend: true },
    defaultEnabled: true,
  },
  shopping: {
    key: "shopping",
    label: "Einkaufsliste",
    description: "Einkaufsplanung mit gemeinsamem Datenstand ueber alle Kanaele.",
    surfaces: { ios: true, pwa: true, web: true, backend: true },
    defaultEnabled: true,
  },
  map: {
    key: "map",
    label: "Weinregionen",
    description: "Weinweltkarte und Regionenwissen.",
    surfaces: { ios: true, pwa: true, web: true, backend: false },
    defaultEnabled: false,
  },
  suggestions: {
    key: "suggestions",
    label: "Vorschlaege",
    description: "Inspiration und Empfehlungen aus dem bisherigen Keller.",
    surfaces: { ios: false, pwa: true, web: true, backend: false },
    defaultEnabled: false,
  },
  merchants: {
    key: "merchants",
    label: "Haendler",
    description: "Verzeichnis und Angebote von Weinhaendlern.",
    surfaces: { ios: false, pwa: true, web: true, backend: false },
    defaultEnabled: false,
  },
  ratings: {
    key: "ratings",
    label: "Bewertungen",
    description: "Auswertungen und Ansichten fuer Bewertungen.",
    surfaces: { ios: false, pwa: true, web: true, backend: false },
    defaultEnabled: false,
  },
  invoiceImport: {
    key: "invoiceImport",
    label: "Rechnungsimport",
    description: "Import von Rechnungen und halbautomatische Erkennung.",
    surfaces: { ios: false, pwa: true, web: true, backend: false },
    defaultEnabled: false,
  },
};

const FEATURE_KEYS = Object.keys(FEATURE_DEFINITIONS) as FeatureKey[];

const CACHE_TTL_MS = 30_000;
let configCache: { config: RuntimeConfig; expiresAt: number } | null = null;

function invalidateConfigCache() {
  configCache = null;
}

function normalizeEnvironment(raw: string | undefined): AppEnvironment {
  if (raw === "dev" || raw === "development") return "dev";
  if (raw === "prod" || raw === "production") return "prod";
  return process.env.NODE_ENV === "production" ? "prod" : "dev";
}

function parseFeatureFlagList(raw: string | undefined): FeatureKey[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is FeatureKey => FEATURE_KEYS.includes(value as FeatureKey));
}

function isEndToEndFeature(definition: FeatureDefinition) {
  return Object.values(definition.surfaces).every(Boolean);
}

function isMissingFeatureFlagStorage(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: unknown; message?: unknown };
  return candidate.code === "P2021" || String(candidate.message ?? "").includes("feature_flags");
}

function createBaseFeatureFlags() {
  const featureFlags = FEATURE_KEYS.reduce((acc, key) => {
    acc[key] = FEATURE_DEFINITIONS[key].defaultEnabled;
    return acc;
  }, {} as Record<FeatureKey, boolean>);

  for (const key of parseFeatureFlagList(process.env.FEATURE_FLAGS)) {
    featureFlags[key] = true;
  }

  for (const key of parseFeatureFlagList(process.env.FEATURE_FLAGS_DISABLE)) {
    featureFlags[key] = false;
  }

  return featureFlags;
}

function normalizeFeatureFlagPatch(payload: unknown): FeatureFlagPatch {
  if (!payload || typeof payload !== "object" || !("featureFlags" in payload)) {
    return {};
  }

  const rawFeatureFlags = (payload as { featureFlags?: unknown }).featureFlags;
  if (!rawFeatureFlags || typeof rawFeatureFlags !== "object") {
    return {};
  }

  return Object.entries(rawFeatureFlags).reduce((acc, [key, value]) => {
    if (FEATURE_KEYS.includes(key as FeatureKey) && typeof value === "boolean") {
      acc[key as FeatureKey] = value;
    }
    return acc;
  }, {} as FeatureFlagPatch);
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  if (configCache && configCache.expiresAt > Date.now()) {
    return configCache.config;
  }

  const environment = normalizeEnvironment(process.env.APP_ENV);
  const featureFlags = createBaseFeatureFlags();
  let storedFeatureFlags: Array<{ key: string; enabled: boolean }> = [];

  try {
    storedFeatureFlags = await prisma.featureFlag.findMany();
  } catch (error) {
    if (!isMissingFeatureFlagStorage(error)) {
      throw error;
    }
  }

  for (const flag of storedFeatureFlags) {
    if (FEATURE_KEYS.includes(flag.key as FeatureKey)) {
      featureFlags[flag.key as FeatureKey] = flag.enabled;
    }
  }

  const config: RuntimeConfig = {
    environment,
    featureFlags,
    features: FEATURE_KEYS.map((key) => ({
      ...FEATURE_DEFINITIONS[key],
      enabled: featureFlags[key],
      isEndToEnd: isEndToEndFeature(FEATURE_DEFINITIONS[key]),
    })),
    generatedAt: new Date().toISOString(),
  };

  configCache = { config, expiresAt: Date.now() + CACHE_TTL_MS };
  return config;
}

export async function updateRuntimeConfig(payload: unknown): Promise<RuntimeConfig> {
  const patch = normalizeFeatureFlagPatch(payload);
  const patchEntries = Object.entries(patch) as Array<[FeatureKey, boolean]>;

  if (patchEntries.length === 0) {
    return getRuntimeConfig();
  }

  for (const [featureKey, enabled] of patchEntries) {
    if (enabled && !isEndToEndFeature(FEATURE_DEFINITIONS[featureKey])) {
      throw new Error(
        `Feature '${featureKey}' kann erst aktiviert werden, wenn iOS, PWA, Web und Backend komplett vorhanden sind.`,
      );
    }
  }

  try {
    await prisma.$transaction(
      patchEntries.map(([featureKey, enabled]) =>
        prisma.featureFlag.upsert({
          where: { key: featureKey },
          create: { key: featureKey, enabled },
          update: { enabled },
        }),
      ),
    );
  } catch (error) {
    if (isMissingFeatureFlagStorage(error)) {
      throw new Error("Die Feature-Flag-Tabelle fehlt noch. Bitte zuerst die Prisma-Migration ausfuehren.");
    }

    throw error;
  }

  invalidateConfigCache();
  return getRuntimeConfig();
}

export function requireFeature(featureKey: FeatureKey): MiddlewareHandler {
  return async (c, next) => {
    const runtimeConfig = await getRuntimeConfig();

    if (!runtimeConfig.featureFlags[featureKey]) {
      return c.json({
        error: `Feature '${featureKey}' ist in ${runtimeConfig.environment.toUpperCase()} deaktiviert.`,
      }, 403);
    }

    await next();
  };
}
