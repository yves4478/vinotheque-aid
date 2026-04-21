// Mobile WineStore — AsyncStorage statt localStorage
// TODO (transfer agent): vollständig implementieren analog zu src/hooks/useWineStore.tsx
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

// TODO (transfer agent): replace this hook-based implementation with a proper
// Zustand store + AsyncStorage persistence for better performance and
// to avoid prop-drilling. Suggested package: zustand + @react-native-async-storage/async-storage
// See: https://docs.pmnd.rs/zustand/integrations/persisting-store-data

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

  // TODO (transfer agent): add addShoppingItem, removeShoppingItem, addWishlistItem,
  // removeWishlistItem, addMerchant, updateMerchant, removeMerchant,
  // consumeWine — same pattern as above.

  return {
    loaded,
    activeEnv,
    setEnv,
    wines,
    addWine,
    updateWine,
    removeWine,
    shopping,
    wishlist,
    merchants,
    consumed,
    settings,
    updateSettings,
    resetAll,
  };
}
