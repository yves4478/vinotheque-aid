import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Wine, WishlistItem, Merchant, MerchantDeal, ConsumedWine, mockWines } from "@/data/wines";
import { testWines } from "@/data/testWines";

// ─── Environment ─────────────────────────────────────────────────────────────

export type AppEnv = "prod" | "test";

const ENV_KEY = "vinvault_env";

function getActiveEnv(): AppEnv {
  const stored = localStorage.getItem(ENV_KEY);
  return stored === "test" ? "test" : "prod";
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
}

const DEFAULT_SETTINGS: AppSettings = { cellarName: "Yves Weinkeller" };

function loadSettings(env: AppEnv): AppSettings {
  try {
    const stored = localStorage.getItem(keys(env).settings);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
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

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Context type ────────────────────────────────────────────────────────────

interface WineStoreContextType {
  activeEnv: AppEnv;
  isTestEnv: boolean;
  switchEnv: (env: AppEnv) => void;
  wines: Wine[];
  addWine: (wine: Omit<Wine, "id">) => void;
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
  addWishlistItem: (item: Omit<WishlistItem, "id" | "createdAt">) => void;
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
  const k = keys(activeEnv);

  const [wines, setWines]               = useState<Wine[]>(() => load(k.wines, []));
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => load(k.shopping, []));
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => load(k.wishlist, []));
  const [merchants, setMerchants]       = useState<Merchant[]>(() => load(k.merchants, []));
  const [consumedWines, setConsumedWines] = useState<ConsumedWine[]>(() => load(k.consumed, []));
  const [settings, setSettings]         = useState<AppSettings>(() => loadSettings(activeEnv));

  useEffect(() => { save(k.wines,     wines);        }, [wines, k.wines]);
  useEffect(() => { save(k.shopping,  shoppingItems); }, [shoppingItems, k.shopping]);
  useEffect(() => { save(k.wishlist,  wishlistItems); }, [wishlistItems, k.wishlist]);
  useEffect(() => { save(k.merchants, merchants);    }, [merchants, k.merchants]);
  useEffect(() => { save(k.consumed,  consumedWines); }, [consumedWines, k.consumed]);
  useEffect(() => { saveSettings(activeEnv, settings); }, [settings, activeEnv]);

  const switchEnv = useCallback((env: AppEnv) => {
    localStorage.setItem(ENV_KEY, env);
    window.location.reload();
  }, []);

  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);

  const addWine = useCallback((wine: Omit<Wine, "id">) => {
    setWines((prev) => [{ ...wine, id: crypto.randomUUID() }, ...prev]);
  }, []);

  const updateWine = useCallback((id: string, updates: Partial<Wine>) => {
    setWines((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  const deleteWine = useCallback((id: string) => {
    setWines((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const loadTestData = useCallback(() => {
    setWines(testWines);
  }, []);

  const resetToEmpty = useCallback(() => {
    setWines([]);
  }, []);

  const addShoppingItem = useCallback((item: Omit<ShoppingItem, "id" | "checked">) => {
    setShoppingItems((prev) => [{ ...item, id: crypto.randomUUID(), checked: false }, ...prev]);
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  }, []);

  const removeShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addWishlistItem = useCallback((item: Omit<WishlistItem, "id" | "createdAt">) => {
    setWishlistItems((prev) => [{
      source: "manual" as const, ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const updateWishlistItem = useCallback((id: string, updates: Partial<WishlistItem>) => {
    setWishlistItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const removeWishlistItem = useCallback((id: string) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addMerchant = useCallback((merchant: Omit<Merchant, "id" | "deals" | "createdAt">) => {
    setMerchants((prev) => [{ ...merchant, id: crypto.randomUUID(), deals: [], createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const updateMerchant = useCallback((id: string, updates: Partial<Omit<Merchant, "id" | "deals" | "createdAt">>) => {
    setMerchants((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const removeMerchant = useCallback((id: string) => {
    setMerchants((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addDeal = useCallback((merchantId: string, deal: Omit<MerchantDeal, "id">) => {
    setMerchants((prev) => prev.map((m) =>
      m.id === merchantId ? { ...m, deals: [{ ...deal, id: crypto.randomUUID() }, ...m.deals] } : m
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
    } else {
      setWines((prev) => prev.map((w) => w.id === wine.id ? { ...w, quantity: w.quantity - 1 } : w));
    }
    setConsumedWines((prev) => [{
      id: crypto.randomUUID(),
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      type: wine.type,
      consumedDate: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const updateSettingsFn = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <WineStoreContext.Provider value={{
      activeEnv,
      isTestEnv: activeEnv === "test",
      switchEnv,
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
