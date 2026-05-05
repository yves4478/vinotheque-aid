import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Wine, AppSettings, ShoppingItem, WishlistItem, Merchant, ConsumedWine } from "@vinotheque/core";
import { DEFAULT_SETTINGS, LOCAL_FEATURE_FLAGS, PROD_FEATURE_FLAGS, createId } from "@vinotheque/core";
import { api } from "../lib/apiClient";

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

function getActiveEnv(): AppEnv {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
  return apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1") ? "test" : "prod";
}

function defaultSettings(env: AppEnv): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    featureFlags: env === "test" ? LOCAL_FEATURE_FLAGS : PROD_FEATURE_FLAGS,
  };
}

function mergeSettings(env: AppEnv, settings: Partial<AppSettings> | null | undefined): AppSettings {
  const defaults = defaultSettings(env);
  return {
    ...defaults,
    ...settings,
    featureFlags: {
      ...defaults.featureFlags,
      ...settings?.featureFlags,
    },
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

function useWineStoreState() {
  const [activeEnv] = useState<AppEnv>(() => getActiveEnv());
  const [wines, setWines]             = useState<Wine[]>([]);
  const [shopping, setShopping]       = useState<ShoppingItem[]>([]);
  const [wishlist, setWishlist]       = useState<WishlistItem[]>([]);
  const [merchants, setMerchants]     = useState<Merchant[]>([]);
  const [consumed, setConsumed]       = useState<ConsumedWine[]>([]);
  const [settings, setSettings]       = useState<AppSettings>(() => defaultSettings(getActiveEnv()));
  const [loaded, setLoaded]           = useState(false);

  // 1. Load from AsyncStorage (fast, works offline)
  useEffect(() => {
    (async () => {
      const env = getActiveEnv();
      const k   = storageKeys(env);
      setWines    (await loadJson<Wine[]>        (k.wines,     []));
      setShopping (await loadJson<ShoppingItem[]>(k.shopping,  []));
      setWishlist (await loadJson<WishlistItem[]>(k.wishlist,  []));
      setMerchants(await loadJson<Merchant[]>    (k.merchants, []));
      setConsumed (await loadJson<ConsumedWine[]>(k.consumed,  []));
      setSettings (mergeSettings(env, await loadJson<Partial<AppSettings> | null>(k.settings, null)));
      setLoaded(true);

      // 2. Sync from API (overrides cache with server state)
      const k2 = storageKeys(env);
      api.wines.list().then((data) => {
        setWines(data as Wine[]);
        saveJson(k2.wines, data).catch(() => {});
      }).catch(() => {});
      api.wishlist.list().then((data) => {
        setWishlist(data as WishlistItem[]);
        saveJson(k2.wishlist, data).catch(() => {});
      }).catch(() => {});
      api.shopping.list().then((data) => {
        setShopping(data as ShoppingItem[]);
        saveJson(k2.shopping, data).catch(() => {});
      }).catch(() => {});
      api.consumed.list().then((data) => {
        setConsumed(data as ConsumedWine[]);
        saveJson(k2.consumed, data).catch(() => {});
      }).catch(() => {});
      api.settings.get().then((remote) => {
        setSettings((prev) => {
          const next = mergeSettings(env, {
            ...prev,
            cellarName: remote.cellarName ?? prev.cellarName,
            featureFlags: {
              ...prev.featureFlags,
              ...remote.featureFlags,
            },
          });
          saveJson(k2.settings, next).catch(() => {});
          return next;
        });
      }).catch(() => {});
    })();
  }, []);

  const addWine = useCallback(async (wine: Wine) => {
    const next = [wine, ...wines];
    setWines(next);
    await saveJson(storageKeys(activeEnv).wines, next);
    api.wines.upsert(wine).catch(() => {});
  }, [wines, activeEnv]);

  const updateWine = useCallback(async (updated: Wine) => {
    const next = wines.map((w) => (w.id === updated.id ? updated : w));
    setWines(next);
    await saveJson(storageKeys(activeEnv).wines, next);
    api.wines.upsert(updated).catch(() => {});
  }, [wines, activeEnv]);

  const removeWine = useCallback(async (id: string) => {
    const next = wines.filter((w) => w.id !== id);
    setWines(next);
    await saveJson(storageKeys(activeEnv).wines, next);
    api.wines.delete(id).catch(() => {});
  }, [wines, activeEnv]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveJson(storageKeys(activeEnv).settings, next);
    api.settings.update({
      cellarName: next.cellarName,
      featureFlags: next.featureFlags,
    }).catch(() => {});
  }, [settings, activeEnv]);

  const resetAll = useCallback(async () => {
    const k = storageKeys(activeEnv);
    await Promise.all(Object.values(k).map((key) => AsyncStorage.removeItem(key)));
    setWines([]); setShopping([]); setWishlist([]); setMerchants([]); setConsumed([]);
    setSettings(defaultSettings(activeEnv));
  }, [activeEnv]);

  const addShoppingItem = useCallback(async (item: ShoppingItem) => {
    const next = [item, ...shopping];
    setShopping(next);
    await saveJson(storageKeys(activeEnv).shopping, next);
    api.shopping.upsert(item).catch(() => {});
  }, [shopping, activeEnv]);

  const updateShoppingItem = useCallback(async (updated: ShoppingItem) => {
    const next = shopping.map((item) => (item.id === updated.id ? updated : item));
    setShopping(next);
    await saveJson(storageKeys(activeEnv).shopping, next);
    api.shopping.upsert(updated).catch(() => {});
  }, [shopping, activeEnv]);

  const removeShoppingItem = useCallback(async (id: string) => {
    const next = shopping.filter((item) => item.id !== id);
    setShopping(next);
    await saveJson(storageKeys(activeEnv).shopping, next);
    api.shopping.delete(id).catch(() => {});
  }, [shopping, activeEnv]);

  const toggleShoppingItem = useCallback(async (id: string) => {
    const next = shopping.map((item) => (
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
    setShopping(next);
    await saveJson(storageKeys(activeEnv).shopping, next);
    const updated = next.find((i) => i.id === id);
    if (updated) api.shopping.upsert(updated).catch(() => {});
  }, [shopping, activeEnv]);

  const addWishlistItem = useCallback(async (item: WishlistItem) => {
    const next = [item, ...wishlist];
    setWishlist(next);
    await saveJson(storageKeys(activeEnv).wishlist, next);
    api.wishlist.upsert(item).catch(() => {});
  }, [wishlist, activeEnv]);

  const updateWishlistItem = useCallback(async (updated: WishlistItem) => {
    const next = wishlist.map((item) => (item.id === updated.id ? updated : item));
    setWishlist(next);
    await saveJson(storageKeys(activeEnv).wishlist, next);
    api.wishlist.upsert(updated).catch(() => {});
  }, [wishlist, activeEnv]);

  const removeWishlistItem = useCallback(async (id: string) => {
    const next = wishlist.filter((item) => item.id !== id);
    setWishlist(next);
    await saveJson(storageKeys(activeEnv).wishlist, next);
    api.wishlist.delete(id).catch(() => {});
  }, [wishlist, activeEnv]);

  const addMerchant = useCallback(async (merchant: Merchant) => {
    const next = [...merchants, merchant];
    setMerchants(next);
    await saveJson(storageKeys(activeEnv).merchants, next);
  }, [merchants, activeEnv]);

  const updateMerchant = useCallback(async (updated: Merchant) => {
    const next = merchants.map((m) => (m.id === updated.id ? updated : m));
    setMerchants(next);
    await saveJson(storageKeys(activeEnv).merchants, next);
  }, [merchants, activeEnv]);

  const removeMerchant = useCallback(async (id: string) => {
    const next = merchants.filter((m) => m.id !== id);
    setMerchants(next);
    await saveJson(storageKeys(activeEnv).merchants, next);
  }, [merchants, activeEnv]);

  const consumeWine = useCallback(async (wineId: string, quantity: number = 1) => {
    const wine = wines.find((item) => item.id === wineId);
    if (!wine) return;

    const consumedQty = Math.max(1, Math.min(quantity, wine.quantity));
    const remaining   = wine.quantity - consumedQty;
    const nextWines   = remaining > 0
      ? wines.map((item) => (item.id === wineId ? { ...item, quantity: remaining } : item))
      : wines.filter((item) => item.id !== wineId);
    const entry: ConsumedWine = {
      id: createId(),
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      type: wine.type,
      consumedDate: new Date().toISOString(),
    };
    const nextConsumed = [entry, ...consumed];

    setWines(nextWines);
    setConsumed(nextConsumed);
    const k = storageKeys(activeEnv);
    await Promise.all([
      saveJson(k.wines, nextWines),
      saveJson(k.consumed, nextConsumed),
    ]);

    if (remaining > 0) {
      const updatedWine = nextWines.find((w) => w.id === wineId);
      if (updatedWine) api.wines.upsert(updatedWine).catch(() => {});
    } else {
      api.wines.delete(wineId).catch(() => {});
    }
    api.consumed.upsert(entry).catch(() => {});
  }, [wines, consumed, activeEnv]);

  return {
    loaded,
    activeEnv,
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

export type WineStore = ReturnType<typeof useWineStoreState>;

const WineStoreContext = createContext<WineStore | null>(null);

export function useWineStore(): WineStore {
  const ctx = useContext(WineStoreContext);
  if (!ctx) throw new Error("useWineStore must be used inside WineStoreProvider");
  return ctx;
}

export function WineStoreProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const store = useWineStoreState();
  return React.createElement(WineStoreContext.Provider, { value: store }, children);
}
