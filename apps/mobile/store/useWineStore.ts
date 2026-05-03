import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Wine,
  AppSettings,
  ShoppingItem,
  WishlistItem,
  Merchant,
  ConsumedWine,
  AppEnvironment,
} from "@vinotheque/core";
import { DEFAULT_SETTINGS, createId } from "@vinotheque/core";
import { api } from "@/lib/apiClient";
import { MOBILE_ENVIRONMENT } from "@/lib/runtime";

export type AppEnv = AppEnvironment;

function storageKeys(env: AppEnv) {
  return {
    wines: `vinotheque_${env}_wines`,
    shopping: `vinotheque_${env}_shopping`,
    wishlist: `vinotheque_${env}_wishlist`,
    merchants: `vinotheque_${env}_merchants`,
    consumed: `vinotheque_${env}_consumed`,
    settings: `vinotheque_${env}_settings`,
  };
}

function legacyStorageKeys(env: AppEnv) {
  const legacyEnv = env === "dev" ? "test" : "prod";

  return {
    wines: `vinotheque_${legacyEnv}_wines`,
    shopping: `vinotheque_${legacyEnv}_shopping`,
    wishlist: `vinotheque_${legacyEnv}_wishlist`,
    merchants: `vinotheque_${legacyEnv}_merchants`,
    consumed: `vinotheque_${legacyEnv}_consumed`,
    settings: `vinotheque_${legacyEnv}_settings`,
  };
}

async function loadRawJson<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore malformed cache and fall back below
  }

  return undefined;
}

async function loadJson<T>(key: string, fallback: T, legacyKey?: string): Promise<T> {
  const current = await loadRawJson<T>(key);
  if (current !== undefined) return current;

  if (legacyKey) {
    const legacy = await loadRawJson<T>(legacyKey);
    if (legacy !== undefined) return legacy;
  }

  return fallback;
}

async function saveJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function useWineStoreState() {
  const activeEnv = MOBILE_ENVIRONMENT;
  const keys = storageKeys(activeEnv);
  const legacyKeys = legacyStorageKeys(activeEnv);

  const [wines, setWines] = useState<Wine[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [consumed, setConsumed] = useState<ConsumedWine[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setWines(await loadJson<Wine[]>(keys.wines, [], legacyKeys.wines));
      setShopping(await loadJson<ShoppingItem[]>(keys.shopping, [], legacyKeys.shopping));
      setWishlist(await loadJson<WishlistItem[]>(keys.wishlist, [], legacyKeys.wishlist));
      setMerchants(await loadJson<Merchant[]>(keys.merchants, [], legacyKeys.merchants));
      setConsumed(await loadJson<ConsumedWine[]>(keys.consumed, [], legacyKeys.consumed));
      setSettings(await loadJson<AppSettings>(keys.settings, DEFAULT_SETTINGS, legacyKeys.settings));
      setLoaded(true);

      api.wines.list().then((data) => {
        setWines(data as Wine[]);
        saveJson(keys.wines, data).catch(() => {});
      }).catch(() => {});

      api.wishlist.list().then((data) => {
        setWishlist(data as WishlistItem[]);
        saveJson(keys.wishlist, data).catch(() => {});
      }).catch(() => {});

      api.shopping.list().then((data) => {
        setShopping(data as ShoppingItem[]);
        saveJson(keys.shopping, data).catch(() => {});
      }).catch(() => {});

      api.consumed.list().then((data) => {
        setConsumed(data as ConsumedWine[]);
        saveJson(keys.consumed, data).catch(() => {});
      }).catch(() => {});
    })();
  }, [keys.consumed, keys.merchants, keys.settings, keys.shopping, keys.wines, keys.wishlist, legacyKeys.consumed, legacyKeys.merchants, legacyKeys.settings, legacyKeys.shopping, legacyKeys.wines, legacyKeys.wishlist]);

  const addWine = useCallback(async (wine: Wine) => {
    const next = [wine, ...wines];
    setWines(next);
    await saveJson(keys.wines, next);
    api.wines.upsert(wine).catch(() => {});
  }, [keys.wines, wines]);

  const updateWine = useCallback(async (updated: Wine) => {
    const next = wines.map((wine) => (wine.id === updated.id ? updated : wine));
    setWines(next);
    await saveJson(keys.wines, next);
    api.wines.upsert(updated).catch(() => {});
  }, [keys.wines, wines]);

  const removeWine = useCallback(async (id: string) => {
    const next = wines.filter((wine) => wine.id !== id);
    setWines(next);
    await saveJson(keys.wines, next);
    api.wines.delete(id).catch(() => {});
  }, [keys.wines, wines]);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveJson(keys.settings, next);
  }, [keys.settings, settings]);

  const resetAll = useCallback(async () => {
    await Promise.all([
      ...Object.values(keys).map((key) => AsyncStorage.removeItem(key)),
      ...Object.values(legacyKeys).map((key) => AsyncStorage.removeItem(key)),
    ]);

    setWines([]);
    setShopping([]);
    setWishlist([]);
    setMerchants([]);
    setConsumed([]);
    setSettings(DEFAULT_SETTINGS);
  }, [keys, legacyKeys]);

  const addShoppingItem = useCallback(async (item: ShoppingItem) => {
    const next = [item, ...shopping];
    setShopping(next);
    await saveJson(keys.shopping, next);
    api.shopping.upsert(item).catch(() => {});
  }, [keys.shopping, shopping]);

  const updateShoppingItem = useCallback(async (updated: ShoppingItem) => {
    const next = shopping.map((item) => (item.id === updated.id ? updated : item));
    setShopping(next);
    await saveJson(keys.shopping, next);
    api.shopping.upsert(updated).catch(() => {});
  }, [keys.shopping, shopping]);

  const removeShoppingItem = useCallback(async (id: string) => {
    const next = shopping.filter((item) => item.id !== id);
    setShopping(next);
    await saveJson(keys.shopping, next);
    api.shopping.delete(id).catch(() => {});
  }, [keys.shopping, shopping]);

  const toggleShoppingItem = useCallback(async (id: string) => {
    const next = shopping.map((item) => (
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
    setShopping(next);
    await saveJson(keys.shopping, next);
    const updated = next.find((item) => item.id === id);
    if (updated) api.shopping.upsert(updated).catch(() => {});
  }, [keys.shopping, shopping]);

  const addWishlistItem = useCallback(async (item: WishlistItem) => {
    const next = [item, ...wishlist];
    setWishlist(next);
    await saveJson(keys.wishlist, next);
    api.wishlist.upsert(item).catch(() => {});
  }, [keys.wishlist, wishlist]);

  const updateWishlistItem = useCallback(async (updated: WishlistItem) => {
    const next = wishlist.map((item) => (item.id === updated.id ? updated : item));
    setWishlist(next);
    await saveJson(keys.wishlist, next);
    api.wishlist.upsert(updated).catch(() => {});
  }, [keys.wishlist, wishlist]);

  const removeWishlistItem = useCallback(async (id: string) => {
    const next = wishlist.filter((item) => item.id !== id);
    setWishlist(next);
    await saveJson(keys.wishlist, next);
    api.wishlist.delete(id).catch(() => {});
  }, [keys.wishlist, wishlist]);

  const addMerchant = useCallback(async (merchant: Merchant) => {
    const next = [...merchants, merchant];
    setMerchants(next);
    await saveJson(keys.merchants, next);
  }, [keys.merchants, merchants]);

  const updateMerchant = useCallback(async (updated: Merchant) => {
    const next = merchants.map((merchant) => (merchant.id === updated.id ? updated : merchant));
    setMerchants(next);
    await saveJson(keys.merchants, next);
  }, [keys.merchants, merchants]);

  const removeMerchant = useCallback(async (id: string) => {
    const next = merchants.filter((merchant) => merchant.id !== id);
    setMerchants(next);
    await saveJson(keys.merchants, next);
  }, [keys.merchants, merchants]);

  const consumeWine = useCallback(async (wineId: string, quantity: number = 1) => {
    const wine = wines.find((item) => item.id === wineId);
    if (!wine) return;

    const consumedQty = Math.max(1, Math.min(quantity, wine.quantity));
    const remaining = wine.quantity - consumedQty;
    const nextWines = remaining > 0
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
    await Promise.all([
      saveJson(keys.wines, nextWines),
      saveJson(keys.consumed, nextConsumed),
    ]);

    if (remaining > 0) {
      const updatedWine = nextWines.find((item) => item.id === wineId);
      if (updatedWine) api.wines.upsert(updatedWine).catch(() => {});
    } else {
      api.wines.delete(wineId).catch(() => {});
    }
    api.consumed.upsert(entry).catch(() => {});
  }, [consumed, keys.consumed, keys.wines, wines]);

  return {
    loaded,
    activeEnv,
    isDevEnvironment: activeEnv === "dev",
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
