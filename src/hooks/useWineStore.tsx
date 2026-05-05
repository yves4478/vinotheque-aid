import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { Wine, WishlistItem, Merchant, MerchantDeal, ConsumedWine } from "@/data/wines";
import { testWines } from "@/data/testWines";
import { api } from "@/lib/apiClient";

// ─── Environment ─────────────────────────────────────────────────────────────

export type AppEnv = "prod" | "test";
export type RuntimeLocation = "local" | "cloud";
export type RuntimeState = "TEST-Local" | "PROD-Local" | "TEST-Cloud" | "PROD-Cloud";

const LOCAL_ENV_KEY = "vinvault_local_env";

function getRuntimeLocation(): RuntimeLocation {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "local"
    : "cloud";
}

function getActiveEnv(): AppEnv {
  if (getRuntimeLocation() === "local") {
    return localStorage.getItem(LOCAL_ENV_KEY) === "prod" ? "prod" : "test";
  }
  return "prod";
}

function getRuntimeState(env: AppEnv, location: RuntimeLocation): RuntimeState {
  if (env === "test" && location === "local") return "TEST-Local";
  if (env === "prod" && location === "local") return "PROD-Local";
  if (env === "test" && location === "cloud") return "TEST-Cloud";
  return "PROD-Cloud";
}

function keys(env: AppEnv) {
  return {
    wines:     `vinvault_${env}_wines`,
    shopping:  `vinvault_${env}_shopping`,
    wishlist:  `vinvault_${env}_wishlist`,
    merchants: `vinvault_${env}_merchants`,
    consumed:  `vinvault_${env}_consumed`,
    settings:  `vinvault_${env}_settings`,
  };
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  cellarName: string;
  anthropicApiKey?: string;
  featureFlags: FeatureFlags;
}

export type FeatureFlagKey =
  | "suggestions"
  | "merchants"
  | "ratings"
  | "wishlist"
  | "tasting"
  | "invoiceImport"
  | "wineMap";

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

const LOCAL_FEATURE_FLAGS: FeatureFlags = {
  suggestions: true,
  merchants: true,
  ratings: true,
  wishlist: true,
  tasting: true,
  invoiceImport: true,
  wineMap: true,
};

const PROD_FEATURE_FLAGS: FeatureFlags = {
  suggestions: false,
  merchants: false,
  ratings: true,
  wishlist: true,
  tasting: false,
  invoiceImport: false,
  wineMap: false,
};

export const FEATURE_FLAG_LABELS: Record<FeatureFlagKey, { label: string; description: string }> = {
  suggestions: {
    label: "Vorschläge",
    description: "Trinkfenster, Empfehlungen und Keller-Hinweise anzeigen.",
  },
  merchants: {
    label: "Weinhändler",
    description: "Händler und Angebote verwalten.",
  },
  ratings: {
    label: "Bewertungen",
    description: "Persönliche Bewertungen und Rating-Ansichten nutzen.",
  },
  wishlist: {
    label: "Merkliste",
    description: "Weine merken, importieren und später kaufen.",
  },
  tasting: {
    label: "Wein-Degu",
    description: "Degustationsnotizen und Bild-Erfassung verwenden.",
  },
  invoiceImport: {
    label: "Rechnung importieren",
    description: "PDF-Rechnungen mit KI-Unterstützung auslesen.",
  },
  wineMap: {
    label: "Weinregionen",
    description: "Interaktive Karten- und Regionenansicht aktivieren.",
  },
};

function defaultFeatureFlags(env: AppEnv): FeatureFlags {
  return env === "test" ? LOCAL_FEATURE_FLAGS : PROD_FEATURE_FLAGS;
}

function defaultSettings(env: AppEnv): AppSettings {
  return {
    cellarName: "Yves Weinkeller",
    featureFlags: defaultFeatureFlags(env),
  };
}

function loadSettings(env: AppEnv): AppSettings {
  const defaults = defaultSettings(env);
  try {
    const stored = localStorage.getItem(keys(env).settings);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      return {
        ...defaults,
        ...parsed,
        featureFlags: {
          ...defaults.featureFlags,
          ...parsed.featureFlags,
        },
      };
    }
  } catch { /* ignore */ }
  return defaults;
}

function saveSettings(env: AppEnv, settings: AppSettings) {
  localStorage.setItem(keys(env).settings, JSON.stringify(settings));
}

// ─── Shopping ────────────────────────────────────────────────────────────────

export interface ShoppingItem {
  id: string;
  name: string;
  producer: string;
  quantity: number;
  estimatedPrice: number;
  reason: string;
  checked: boolean;
}

// ─── Generic loaders/savers ──────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch { /* ignore */ }
  return fallback;
}

function save(key: string, value: unknown, options?: { throwOnError?: boolean }) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key}`, error);
    if (options?.throwOnError) throw error;
  }
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Context type ────────────────────────────────────────────────────────────

interface WineStoreContextType {
  activeEnv: AppEnv;
  isTestEnv: boolean;
  runtimeLocation: RuntimeLocation;
  runtimeState: RuntimeState;
  setLocalRuntimeEnv: (env: AppEnv) => void;
  wines: Wine[];
  addWine: (wine: Omit<Wine, "id">) => Wine;
  updateWine: (id: string, updates: Partial<Wine>) => void;
  deleteWine: (id: string) => void;
  loadTestData: () => void;
  resetToEmpty: () => void;
  shoppingItems: ShoppingItem[];
  addShoppingItem: (item: Omit<ShoppingItem, "id" | "checked">) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  totalBottles: number;
  wishlistItems: WishlistItem[];
  addWishlistItem: (item: Omit<WishlistItem, "id" | "createdAt">) => WishlistItem;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  removeWishlistItem: (id: string) => void;
  merchants: Merchant[];
  addMerchant: (merchant: Omit<Merchant, "id" | "deals" | "createdAt">) => void;
  updateMerchant: (id: string, updates: Partial<Omit<Merchant, "id" | "deals" | "createdAt">>) => void;
  removeMerchant: (id: string) => void;
  addDeal: (merchantId: string, deal: Omit<MerchantDeal, "id">) => void;
  updateDeal: (merchantId: string, dealId: string, updates: Partial<Omit<MerchantDeal, "id">>) => void;
  removeDeal: (merchantId: string, dealId: string) => void;
  consumedWines: ConsumedWine[];
  consumeWine: (wine: Wine) => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const WineStoreContext = createContext<WineStoreContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function WineStoreProvider({ children }: { children: ReactNode }) {
  const activeEnv = getActiveEnv();
  const runtimeLocation = getRuntimeLocation();
  const runtimeState = getRuntimeState(activeEnv, runtimeLocation);
  const k = keys(activeEnv);

  const [wines, setWines]                 = useState<Wine[]>(() => load(k.wines, []));
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => load(k.shopping, []));
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => load(k.wishlist, []));
  const [merchants, setMerchants]         = useState<Merchant[]>(() => load(k.merchants, []));
  const [consumedWines, setConsumedWines] = useState<ConsumedWine[]>(() => load(k.consumed, []));
  const [settings, setSettings]           = useState<AppSettings>(() => loadSettings(activeEnv));

  // Refs for synchronous access in callbacks (needed for throwOnError pattern)
  const winesRef         = useRef(wines);
  const wishlistItemsRef = useRef(wishlistItems);

  // Sync localStorage cache
  useEffect(() => { winesRef.current = wines;         save(k.wines,     wines);        }, [wines, k.wines]);
  useEffect(() => { wishlistItemsRef.current = wishlistItems; save(k.wishlist, wishlistItems); }, [wishlistItems, k.wishlist]);
  useEffect(() => { save(k.shopping,  shoppingItems); }, [shoppingItems, k.shopping]);
  useEffect(() => { save(k.merchants, merchants);     }, [merchants, k.merchants]);
  useEffect(() => { save(k.consumed,  consumedWines); }, [consumedWines, k.consumed]);
  useEffect(() => { saveSettings(activeEnv, settings); }, [settings, activeEnv]);

  useEffect(() => {
    api.settings.get().then((remote) => {
      setSettings((prev) => ({
        ...prev,
        cellarName: remote.cellarName ?? prev.cellarName,
        featureFlags: {
          ...prev.featureFlags,
          ...remote.featureFlags,
        },
      }));
    }).catch(() => {});
  }, []);

  // Load from API on mount (overrides localStorage cache with server state)
  useEffect(() => {
    api.wines.list().then((data) => { setWines(data as Wine[]); }).catch(() => {});
    api.wishlist.list().then((data) => { setWishlistItems(data as WishlistItem[]); }).catch(() => {});
    api.shopping.list().then((data) => { setShoppingItems(data as ShoppingItem[]); }).catch(() => {});
    api.consumed.list().then((data) => { setConsumedWines(data as ConsumedWine[]); }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);

  const addWine = useCallback((wine: Omit<Wine, "id">): Wine => {
    const nextWine = { ...wine, id: createId() };
    const nextWines = [nextWine, ...winesRef.current];
    save(k.wines, nextWines, { throwOnError: true });
    winesRef.current = nextWines;
    setWines(nextWines);
    api.wines.upsert(nextWine).catch(() => {});
    return nextWine;
  }, [k.wines]);

  const updateWine = useCallback((id: string, updates: Partial<Wine>) => {
    setWines((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
      const updated = next.find((w) => w.id === id);
      if (updated) api.wines.upsert(updated).catch(() => {});
      return next;
    });
  }, []);

  const deleteWine = useCallback((id: string) => {
    setWines((prev) => prev.filter((w) => w.id !== id));
    api.wines.delete(id).catch(() => {});
  }, []);

  const loadTestData = useCallback(() => {
    setWines(testWines);
  }, []);

  const resetToEmpty = useCallback(() => {
    setWines([]);
  }, []);

  const addShoppingItem = useCallback((item: Omit<ShoppingItem, "id" | "checked">) => {
    const next = { ...item, id: createId(), checked: false };
    setShoppingItems((prev) => [next, ...prev]);
    api.shopping.upsert(next).catch(() => {});
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => {
      const items = prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
      const updated = items.find((i) => i.id === id);
      if (updated) api.shopping.upsert(updated).catch(() => {});
      return items;
    });
  }, []);

  const removeShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => prev.filter((i) => i.id !== id));
    api.shopping.delete(id).catch(() => {});
  }, []);

  const addWishlistItem = useCallback((item: Omit<WishlistItem, "id" | "createdAt">): WishlistItem => {
    const nextItem: WishlistItem = {
      source: "manual" as const,
      ...item,
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    const nextWishlistItems = [nextItem, ...wishlistItemsRef.current];
    save(k.wishlist, nextWishlistItems, { throwOnError: true });
    wishlistItemsRef.current = nextWishlistItems;
    setWishlistItems(nextWishlistItems);
    api.wishlist.upsert(nextItem).catch(() => {});
    return nextItem;
  }, [k.wishlist]);

  const updateWishlistItem = useCallback((id: string, updates: Partial<WishlistItem>) => {
    setWishlistItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
      const updated = next.find((i) => i.id === id);
      if (updated) api.wishlist.upsert(updated).catch(() => {});
      return next;
    });
  }, []);

  const removeWishlistItem = useCallback((id: string) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));
    api.wishlist.delete(id).catch(() => {});
  }, []);

  const addMerchant = useCallback((merchant: Omit<Merchant, "id" | "deals" | "createdAt">) => {
    setMerchants((prev) => [{ ...merchant, id: createId(), deals: [], createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const updateMerchant = useCallback((id: string, updates: Partial<Omit<Merchant, "id" | "deals" | "createdAt">>) => {
    setMerchants((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const removeMerchant = useCallback((id: string) => {
    setMerchants((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addDeal = useCallback((merchantId: string, deal: Omit<MerchantDeal, "id">) => {
    setMerchants((prev) => prev.map((m) =>
      m.id === merchantId ? { ...m, deals: [{ ...deal, id: createId() }, ...m.deals] } : m
    ));
  }, []);

  const updateDeal = useCallback((merchantId: string, dealId: string, updates: Partial<Omit<MerchantDeal, "id">>) => {
    setMerchants((prev) => prev.map((m) =>
      m.id === merchantId
        ? { ...m, deals: m.deals.map((d) => (d.id === dealId ? { ...d, ...updates } : d)) }
        : m
    ));
  }, []);

  const removeDeal = useCallback((merchantId: string, dealId: string) => {
    setMerchants((prev) => prev.map((m) =>
      m.id === merchantId ? { ...m, deals: m.deals.filter((d) => d.id !== dealId) } : m
    ));
  }, []);

  const consumeWine = useCallback((wine: Wine) => {
    if (wine.quantity <= 1) {
      setWines((prev) => prev.filter((w) => w.id !== wine.id));
      api.wines.delete(wine.id).catch(() => {});
    } else {
      const updated = { ...wine, quantity: wine.quantity - 1 };
      setWines((prev) => prev.map((w) => w.id === wine.id ? updated : w));
      api.wines.upsert(updated).catch(() => {});
    }
    const consumed = {
      id: createId(),
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      type: wine.type,
      consumedDate: new Date().toISOString(),
    };
    setConsumedWines((prev) => [consumed, ...prev]);
    api.consumed.upsert(consumed).catch(() => {});
  }, []);

  const updateSettingsFn = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      api.settings.update({
        cellarName: next.cellarName,
        featureFlags: next.featureFlags,
      }).catch(() => {});
      return next;
    });
  }, []);

  const setLocalRuntimeEnv = useCallback((env: AppEnv) => {
    if (getRuntimeLocation() !== "local") return;
    localStorage.setItem(LOCAL_ENV_KEY, env);
    window.location.reload();
  }, []);

  return (
    <WineStoreContext.Provider value={{
      activeEnv,
      isTestEnv: activeEnv === "test",
      runtimeLocation,
      runtimeState,
      setLocalRuntimeEnv,
      wines, addWine, updateWine, deleteWine, loadTestData, resetToEmpty,
      shoppingItems, addShoppingItem, toggleShoppingItem, removeShoppingItem,
      totalBottles,
      wishlistItems, addWishlistItem, updateWishlistItem, removeWishlistItem,
      merchants, addMerchant, updateMerchant, removeMerchant,
      addDeal, updateDeal, removeDeal,
      consumedWines, consumeWine,
      settings, updateSettings: updateSettingsFn,
    }}>
      {children}
    </WineStoreContext.Provider>
  );
}

export function useWineStore() {
  const ctx = useContext(WineStoreContext);
  if (!ctx) throw new Error("useWineStore must be used within WineStoreProvider");
  return ctx;
}
