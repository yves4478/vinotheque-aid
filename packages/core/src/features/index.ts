export type AppEnvironment = "dev" | "prod";

export type AppSurface = "ios" | "pwa" | "web" | "backend";

export type FeatureKey =
  | "inventory"
  | "wishlist"
  | "shopping"
  | "map"
  | "suggestions"
  | "merchants"
  | "ratings"
  | "invoiceImport";

export interface FeatureSurfaceMatrix {
  ios: boolean;
  pwa: boolean;
  web: boolean;
  backend: boolean;
}

export interface FeatureDefinition {
  key: FeatureKey;
  label: string;
  description: string;
  surfaces: FeatureSurfaceMatrix;
  defaultEnabled: boolean;
}

export type FeatureFlags = Record<FeatureKey, boolean>;

export interface RuntimeFeatureState extends FeatureDefinition {
  enabled: boolean;
  isEndToEnd: boolean;
}

export interface RuntimeConfig {
  environment: AppEnvironment;
  featureFlags: FeatureFlags;
  features: RuntimeFeatureState[];
  generatedAt: string;
}

export const FEATURE_DEFINITIONS: Record<FeatureKey, FeatureDefinition> = {
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

export const FEATURE_KEYS = Object.keys(FEATURE_DEFINITIONS) as FeatureKey[];

export function normalizeEnvironment(
  value: string | undefined,
  fallback: AppEnvironment = "prod",
): AppEnvironment {
  if (value === "dev" || value === "development") return "dev";
  if (value === "prod" || value === "production") return "prod";
  return fallback;
}

export function isEndToEndFeature(definition: FeatureDefinition): boolean {
  return Object.values(definition.surfaces).every(Boolean);
}

export function createFeatureFlags(overrides?: Partial<FeatureFlags>): FeatureFlags {
  return FEATURE_KEYS.reduce((acc, key) => {
    acc[key] = overrides?.[key] ?? FEATURE_DEFINITIONS[key].defaultEnabled;
    return acc;
  }, {} as FeatureFlags);
}

export function parseFeatureFlagList(raw: string | undefined): FeatureKey[] {
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is FeatureKey => FEATURE_KEYS.includes(value as FeatureKey));
}

export function applyFeatureFlagOverrides(
  baseFlags: FeatureFlags,
  options?: { enable?: string; disable?: string },
): FeatureFlags {
  const next = { ...baseFlags };

  for (const key of parseFeatureFlagList(options?.enable)) {
    next[key] = true;
  }

  for (const key of parseFeatureFlagList(options?.disable)) {
    next[key] = false;
  }

  return next;
}

export function createRuntimeConfig(options: {
  environment: AppEnvironment;
  enable?: string;
  disable?: string;
}): RuntimeConfig {
  const featureFlags = applyFeatureFlagOverrides(createFeatureFlags(), {
    enable: options.enable,
    disable: options.disable,
  });

  return {
    environment: options.environment,
    featureFlags,
    features: FEATURE_KEYS.map((key) => {
      const definition = FEATURE_DEFINITIONS[key];
      return {
        ...definition,
        enabled: featureFlags[key],
        isEndToEnd: isEndToEndFeature(definition),
      };
    }),
    generatedAt: new Date().toISOString(),
  };
}

export function isFeatureEnabled(
  featureFlags: FeatureFlags,
  featureKey: FeatureKey,
): boolean {
  return featureFlags[featureKey];
}
