import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Wine, mockWines } from "@/data/wines";

const STORAGE_KEY = "vinvault_wines";
const SHOPPING_KEY = "vinvault_shopping";

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

interface WineStoreContextType {
  wines: Wine[];
  addWine: (wine: Omit<Wine, "id">) => void;
  updateWine: (id: string, updates: Partial<Wine>) => void;
  deleteWine: (id: string) => void;
  shoppingItems: ShoppingItem[];
  addShoppingItem: (item: Omit<ShoppingItem, "id" | "checked">) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  totalBottles: number;
}

const WineStoreContext = createContext<WineStoreContextType | null>(null);

export function WineStoreProvider({ children }: { children: ReactNode }) {
  const [wines, setWines] = useState<Wine[]>(loadWines);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(loadShopping);

  useEffect(() => { saveWines(wines); }, [wines]);
  useEffect(() => { saveShopping(shoppingItems); }, [shoppingItems]);

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

  return (
    <WineStoreContext.Provider
      value={{
        wines,
        addWine,
        updateWine,
        deleteWine,
        shoppingItems,
        addShoppingItem,
        toggleShoppingItem,
        removeShoppingItem,
        totalBottles,
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
