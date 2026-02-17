import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Wine, WishlistItem, Merchant, MerchantDeal, ConsumedWine, mockWines } from "@/data/wines";
import { testWines } from "@/data/testWines";

const STORAGE_KEY = "vinvault_wines";
const SHOPPING_KEY = "vinvault_shopping";
const WISHLIST_KEY = "vinvault_wishlist";
const MERCHANTS_KEY = "vinvault_merchants";
const CONSUMED_KEY = "vinvault_consumed";
const SETTINGS_KEY = "vinvault_settings";

export interface AppSettings {
  cellarName: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  cellarName: "Yves Weinkeller",
};

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export interface ShoppingItem {
  id: string;
  name: string;
  producer: string;
  quantity: number;
  estimatedPrice: number;
  reason: string;
  checked: boolean;
}

function loadWines(): Wine[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* ignore */ }
  return mockWines;
}

function saveWines(wines: Wine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wines));
}

function loadShopping(): ShoppingItem[] {
  try {
    const stored = localStorage.getItem(SHOPPING_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* ignore */ }
  return [];
}

function saveShopping(items: ShoppingItem[]) {
  localStorage.setItem(SHOPPING_KEY, JSON.stringify(items));
}

function loadWishlist(): WishlistItem[] {
  try {
    const stored = localStorage.getItem(WISHLIST_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* ignore */ }
  return [];
}

function saveWishlist(items: WishlistItem[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

function loadConsumed(): ConsumedWine[] {
  try {
    const stored = localStorage.getItem(CONSUMED_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* ignore */ }
  return [];
}

function saveConsumed(items: ConsumedWine[]) {
  localStorage.setItem(CONSUMED_KEY, JSON.stringify(items));
}

function loadMerchants(): Merchant[] {
  try {
    const stored = localStorage.getItem(MERCHANTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* ignore */ }
  return [];
}

function saveMerchants(merchants: Merchant[]) {
  localStorage.setItem(MERCHANTS_KEY, JSON.stringify(merchants));
}

interface WineStoreContextType {
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

export function WineStoreProvider({ children }: { children: ReactNode }) {
  const [wines, setWines] = useState<Wine[]>(loadWines);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(loadShopping);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(loadWishlist);
  const [merchants, setMerchants] = useState<Merchant[]>(loadMerchants);
  const [consumedWines, setConsumedWines] = useState<ConsumedWine[]>(loadConsumed);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => { saveWines(wines); }, [wines]);
  useEffect(() => { saveShopping(shoppingItems); }, [shoppingItems]);
  useEffect(() => { saveWishlist(wishlistItems); }, [wishlistItems]);
  useEffect(() => { saveMerchants(merchants); }, [merchants]);
  useEffect(() => { saveConsumed(consumedWines); }, [consumedWines]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);

  const addWine = useCallback((wine: Omit<Wine, "id">) => {
    const id = crypto.randomUUID();
    setWines((prev) => [{ ...wine, id }, ...prev]);
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
    const id = crypto.randomUUID();
    setShoppingItems((prev) => [{ ...item, id, checked: false }, ...prev]);
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  }, []);

  const removeShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addWishlistItem = useCallback((item: Omit<WishlistItem, "id" | "createdAt">) => {
    const id = crypto.randomUUID();
    setWishlistItems((prev) => [{ ...item, id, createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const updateWishlistItem = useCallback((id: string, updates: Partial<WishlistItem>) => {
    setWishlistItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const removeWishlistItem = useCallback((id: string) => {
    setWishlistItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addMerchant = useCallback((merchant: Omit<Merchant, "id" | "deals" | "createdAt">) => {
    const id = crypto.randomUUID();
    setMerchants((prev) => [{ ...merchant, id, deals: [], createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const updateMerchant = useCallback((id: string, updates: Partial<Omit<Merchant, "id" | "deals" | "createdAt">>) => {
    setMerchants((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const removeMerchant = useCallback((id: string) => {
    setMerchants((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addDeal = useCallback((merchantId: string, deal: Omit<MerchantDeal, "id">) => {
    const id = crypto.randomUUID();
    setMerchants((prev) => prev.map((m) =>
      m.id === merchantId ? { ...m, deals: [{ ...deal, id }, ...m.deals] } : m
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
    // Decrement quantity (remove wine if last bottle)
    if (wine.quantity <= 1) {
      setWines((prev) => prev.filter((w) => w.id !== wine.id));
    } else {
      setWines((prev) => prev.map((w) => w.id === wine.id ? { ...w, quantity: w.quantity - 1 } : w));
    }
    // Record consumption
    const entry: ConsumedWine = {
      id: crypto.randomUUID(),
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      type: wine.type,
      consumedDate: new Date().toISOString(),
    };
    setConsumedWines((prev) => [entry, ...prev]);
  }, []);

  const updateSettingsFn = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <WineStoreContext.Provider
      value={{
        wines,
        addWine,
        updateWine,
        deleteWine,
        loadTestData,
        resetToEmpty,
        shoppingItems,
        addShoppingItem,
        toggleShoppingItem,
        removeShoppingItem,
        totalBottles,
        wishlistItems,
        addWishlistItem,
        updateWishlistItem,
        removeWishlistItem,
        merchants,
        addMerchant,
        updateMerchant,
        removeMerchant,
        addDeal,
        updateDeal,
        removeDeal,
        consumedWines,
        consumeWine,
        settings,
        updateSettings: updateSettingsFn,
      }}
    >
      {children}
    </WineStoreContext.Provider>
  );
}

export function useWineStore() {
  const ctx = useContext(WineStoreContext);
  if (!ctx) throw new Error("useWineStore must be used within WineStoreProvider");
  return ctx;
}
