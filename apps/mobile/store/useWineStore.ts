// Mobile WineStore — AsyncStorage statt localStorage
// Wichtig: AsyncStorage ist async -> useEffect für Initialisierung nötig.
// Empfehlung: Zustand-Library (z.B. Zustand + zustand/middleware/persist mit AsyncStorage)
// oder eigener Context + useReducer.

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Wine, AppSettings, ShoppingItem, WishlistItem, Merchant, ConsumedWine } from "@vinotheque/core";
import { DEFAULT_SETTINGS, createId } from "@vinotheque/core";

export type AppEnv = "prod" | "test";

function storageKeys(env: AppEnv) {
  return {
    wines:     `vinotheque_${env}_wines`,
    shopping:  `vinotheque_${env}_shopping`,
    wishlist:  `vinotheque_${env}_wishlist`,
    merchants: `vinotheque_${env}_merchants`,
    consumed:  `vinotheque_${env}_consumed`,
    settings:  `vinotheque_${env}_settings`,
    env:       "vinotheque_env",
  };
}

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

async function saveJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Future optimization: replace this hook-based implementation with a proper
// Zustand store + AsyncStorage persistence for better performance.

export function useWineStore() {
  const [activeEnv, setActiveEnvState] = useState<AppEnv>("prod");
  const [wines, setWines]             = useState<Wine[]>([]);
  const [shopping, setShopping]       = useState<ShoppingItem[]>([]);
  const [wishlist, setWishlist]       = useState<WishlistItem[]>([]);
  const [merchants, setMerchants]     = useState<Merchant[]>([]);
  const [consumed, setConsumed]       = useState<ConsumedWine[]>([]);
  const [settings, setSettings]       = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded]           = useState(false);

  // Initial load
  useEffect(() => {
    (async () => {
      const env = (await AsyncStorage.getItem("vinotheque_env") ?? "prod") as AppEnv;
      const k   = storageKeys(env);
      setActiveEnvState(env);
      setWines    (await loadJson<Wine[]>        (k.wines,     []));
      setShopping (await loadJson<ShoppingItem[]>(k.shopping,  []));
      setWishlist (await loadJson<WishlistItem[]>(k.wishlist,  []));
      setMerchants(await loadJson<Merchant[]>    (k.merchants, []));
      setConsumed (await loadJson<ConsumedWine[]>(k.consumed,  []));
      setSettings (await loadJson<AppSettings>   (k.settings,  DEFAULT_SETTINGS));
      setLoaded(true);
    })();
  }, []);

  async function setEnv(env: AppEnv) {
    await AsyncStorage.setItem("vinotheque_env", env);
    const k = storageKeys(env);
    setActiveEnvState(env);
    setWines    (await loadJson<Wine[]>        (k.wines,     []));
    setShopping (await loadJson<ShoppingItem[]>(k.shopping,  []));
    setWishlist (await loadJson<WishlistItem[]>(k.wishlist,  []));
    setMerchants(await loadJson<Merchant[]>    (k.merchants, []));
    setConsumed (await loadJson<ConsumedWine[]>(k.consumed,  []));
    setSettings (await loadJson<AppSettings>   (k.settings,  DEFAULT_SETTINGS));
  }

  const addWine = useCallback(async (wine: Wine) => {
    const next = [...wines, wine];
    setWines(next);
    await saveJson(storageKeys(activeEnv).wines, next);
  }, [wines, activeEnv]);

  const updateWine = useCallback(async (updated: Wine) => {
    const next = wines.map((w) => (w.id === updated.id ? updated : w));
    setWines(next);
    await saveJson(storageKeys(activeEnv).wines, next);
  }, [wines, activeEnv]);

  const removeWine = useCallback(async (id: string) => {
    const next = wines.filter((w) => w.id !== id);
    setWines(next);
    await saveJson(storageKeys(activeEnv).wines, next);
  }, [wines, activeEnv]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveJson(storageKeys(activeEnv).settings, next);
  }, [settings, activeEnv]);

  const resetAll = useCallback(async () => {
    const k = storageKeys(activeEnv);
    await Promise.all(Object.values(k).map((key) => AsyncStorage.removeItem(key)));
    setWines([]); setShopping([]); setWishlist([]); setMerchants([]); setConsumed([]);
    setSettings(DEFAULT_SETTINGS);
  }, [activeEnv]);

  const addShoppingItem = useCallback(async (item: ShoppingItem) => {
    const next = [...shopping, item];
    setShopping(next);
    await saveJson(storageKeys(activeEnv).shopping, next);
  }, [shopping, activeEnv]);

  const updateShoppingItem = useCallback(async (updated: ShoppingItem) => {
    const next = shopping.map((item) => (item.id === updated.id ? updated : item));
    setShopping(next);
    await saveJson(storageKeys(activeEnv).shopping, next);
  }, [shopping, activeEnv]);

  const removeShoppingItem = useCallback(async (id: string) => {
    const next = shopping.filter((item) => item.id !== id);
    setShopping(next);
    await saveJson(storageKeys(activeEnv).shopping, next);
  }, [shopping, activeEnv]);

  const toggleShoppingItem = useCallback(async (id: string) => {
    const next = shopping.map((item) => (
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
    setShopping(next);
    await saveJson(storageKeys(activeEnv).shopping, next);
  }, [shopping, activeEnv]);

  const addWishlistItem = useCallback(async (item: WishlistItem) => {
    const next = [...wishlist, item];
    setWishlist(next);
    await saveJson(storageKeys(activeEnv).wishlist, next);
  }, [wishlist, activeEnv]);

  const updateWishlistItem = useCallback(async (updated: WishlistItem) => {
    const next = wishlist.map((item) => (item.id === updated.id ? updated : item));
    setWishlist(next);
    await saveJson(storageKeys(activeEnv).wishlist, next);
  }, [wishlist, activeEnv]);

  const removeWishlistItem = useCallback(async (id: string) => {
    const next = wishlist.filter((item) => item.id !== id);
    setWishlist(next);
    await saveJson(storageKeys(activeEnv).wishlist, next);
  }, [wishlist, activeEnv]);

  const addMerchant = useCallback(async (merchant: Merchant) => {
    const next = [...merchants, merchant];
    setMerchants(next);
    await saveJson(storageKeys(activeEnv).merchants, next);
  }, [merchants, activeEnv]);

  const updateMerchant = useCallback(async (updated: Merchant) => {
    const next = merchants.map((merchant) => (
      merchant.id === updated.id ? updated : merchant
    ));
    setMerchants(next);
    await saveJson(storageKeys(activeEnv).merchants, next);
  }, [merchants, activeEnv]);

  const removeMerchant = useCallback(async (id: string) => {
    const next = merchants.filter((merchant) => merchant.id !== id);
    setMerchants(next);
    await saveJson(storageKeys(activeEnv).merchants, next);
  }, [merchants, activeEnv]);

  const consumeWine = useCallback(async (wineId: string, quantity: number = 1) => {
    const wine = wines.find((item) => item.id === wineId);
    if (!wine) return;

    const consumedQuantity = Math.max(1, Math.min(quantity, wine.quantity));
    const remainingQuantity = wine.quantity - consumedQuantity;
    const nextWines = remainingQuantity > 0
      ? wines.map((item) => (
        item.id === wineId ? { ...item, quantity: remainingQuantity } : item
      ))
      : wines.filter((item) => item.id !== wineId);
    const nextConsumed: ConsumedWine[] = [{
      id: createId(),
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      type: wine.type,
      consumedDate: new Date().toISOString(),
    }, ...consumed];

    setWines(nextWines);
    setConsumed(nextConsumed);
    const k = storageKeys(activeEnv);
    await Promise.all([
      saveJson(k.wines, nextWines),
      saveJson(k.consumed, nextConsumed),
    ]);
  }, [wines, consumed, activeEnv]);

  return {
    loaded,
    activeEnv,
    setEnv,
    wines,
    addWine,
    updateWine,
    removeWine,
    shopping,
    addShoppingItem,
    updateShoppingItem,
    removeShoppingItem,
    toggleShoppingItem,
    wishlist,
    addWishlistItem,
    updateWishlistItem,
    removeWishlistItem,
    merchants,
    addMerchant,
    updateMerchant,
    removeMerchant,
    consumed,
    consumeWine,
    settings,
    updateSettings,
    resetAll,
  };
}
