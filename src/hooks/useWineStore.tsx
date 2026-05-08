import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { Wine, WishlistItem, Merchant, MerchantDeal, ConsumedWine, WineImage } from "@/data/wines";
import type { CellarMovement } from "@vinotheque/core";
import { testWines } from "@/data/testWines";
import { api } from "@/lib/apiClient";
import { WEB_ENVIRONMENT } from "@/lib/runtime";
import {
  buildLocalImageStorageWarning,
  createId,
  DEFAULT_SETTINGS,
  estimateStoredImageBytesTotal,
  type AppEnvironment,
  type AppSettings,
} from "@vinotheque/core";

// ─── Environment ─────────────────────────────────────────────────────────────

export type AppEnv = AppEnvironment;

function keys(env: AppEnv) {
  return {
    wines: `vinotheque_${env}_wines`,
    shopping: `vinotheque_${env}_shopping`,
    wishlist: `vinotheque_${env}_wishlist`,
    merchants: `vinotheque_${env}_merchants`,
    consumed: `vinotheque_${env}_consumed`,
    movements: `vinotheque_${env}_movements`,
    settings: `vinotheque_${env}_settings`,
  };
}

function legacyKeys(env: AppEnv) {
  const legacyEnv = env === "dev" ? "test" : "prod";
  return {
    wines: `vinvault_${legacyEnv}_wines`,
    shopping: `vinvault_${legacyEnv}_shopping`,
    wishlist: `vinvault_${legacyEnv}_wishlist`,
    merchants: `vinvault_${legacyEnv}_merchants`,
    consumed: `vinvault_${legacyEnv}_consumed`,
    movements: `vinvault_${legacyEnv}_movements`,
    settings: `vinvault_${legacyEnv}_settings`,
  };
}

function loadStored<T>(key: string): T | undefined {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // ignore malformed local state and fall back below
  }
  return undefined;
}

// ─── Settings ────────────────────────────────────────────────────────────────

function loadSettings(env: AppEnv): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...load(keys(env).settings, DEFAULT_SETTINGS, legacyKeys(env).settings),
  };
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
  priority?: 1 | 2 | 3;
}

// ─── Generic loaders/savers ──────────────────────────────────────────────────

function load<T>(key: string, fallback: T, legacyKey?: string): T {
  const current = loadStored<T>(key);
  if (current !== undefined) return current;

  if (legacyKey) {
    const legacy = loadStored<T>(legacyKey);
    if (legacy !== undefined) return legacy;
  }

  return fallback;
}

function save(key: string, value: unknown, options?: { throwOnError?: boolean }) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    const normalized = normalizeStorageError(error);
    console.error(`Failed to save ${key}`, normalized);
    if (options?.throwOnError) throw normalized;
  }
}

function toApiShoppingItem(item: ShoppingItem) {
  const { priority: _priority, ...apiItem } = item;
  return apiItem;
}

function isQuotaExceededError(error: unknown) {
  const name = typeof error === "object" && error && "name" in error
    ? String((error as { name?: unknown }).name)
    : "";
  return name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED";
}

function normalizeStorageError(error: unknown): Error {
  if (isQuotaExceededError(error)) {
    return new Error(
      "Der lokale Browser-Speicher fuer Bilder ist fast voll. Bitte weniger Fotos speichern oder auf den spaeteren Cloud-Storage-Pfad wechseln.",
    );
  }

  return error instanceof Error
    ? error
    : new Error("Lokales Speichern ist fehlgeschlagen.");
}

function isEmbeddedImage(image: WineImage): boolean {
  return image.uri.startsWith("data:");
}

function stripEmbeddedImages(wine: Wine): Wine {
  const images = (wine.images ?? []).filter((image) => !isEmbeddedImage(image));
  return {
    ...wine,
    images: images.length > 0 ? images : undefined,
    imageData: wine.imageData?.startsWith("data:") ? undefined : wine.imageData,
    imageUri: wine.imageUri?.startsWith("data:") ? undefined : wine.imageUri,
  };
}

function normalizePrimaryImages(images: WineImage[]): WineImage[] {
  const hasPrimary = images.some((image) => image.isPrimary);
  return images.map((image, index) => ({
    ...image,
    isPrimary: hasPrimary ? image.isPrimary : index === 0,
  }));
}

// ─── Context type ────────────────────────────────────────────────────────────

interface WineStoreContextType {
  activeEnv: AppEnv;
  isDevEnvironment: boolean;
  wines: Wine[];
  addWine: (wine: Omit<Wine, "id">) => Wine;
  updateWine: (id: string, updates: Partial<Wine>) => void;
  deleteWine: (id: string) => void;
  loadSampleData: () => void;
  resetToEmpty: () => void;
  shoppingItems: ShoppingItem[];
  addShoppingItem: (item: Omit<ShoppingItem, "id" | "checked">) => void;
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => void;
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
  consumeWine: (wine: Wine, quantity?: number, occasion?: string) => void;
  cellarMovements: CellarMovement[];
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  localImageStorageWarning?: string;
}

const WineStoreContext = createContext<WineStoreContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function WineStoreProvider({ children }: { children: ReactNode }) {
  const activeEnv = WEB_ENVIRONMENT;
  const k = keys(activeEnv);
  const legacy = legacyKeys(activeEnv);

  const [wines, setWines]                 = useState<Wine[]>(() => load(k.wines, [], legacy.wines));
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => load(k.shopping, [], legacy.shopping));
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => load(k.wishlist, [], legacy.wishlist));
  const [merchants, setMerchants]         = useState<Merchant[]>(() => load(k.merchants, [], legacy.merchants));
  const [consumedWines, setConsumedWines] = useState<ConsumedWine[]>(() => load(k.consumed, [], legacy.consumed));
  const [cellarMovements, setCellarMovements] = useState<CellarMovement[]>(() => load(k.movements, [], legacy.movements));
  const [settings, setSettings]           = useState<AppSettings>(() => loadSettings(activeEnv));

  // Refs for synchronous access in callbacks (needed for throwOnError pattern)
  const winesRef         = useRef(wines);
  const wishlistItemsRef = useRef(wishlistItems);
  const shoppingItemsRef = useRef(shoppingItems);

  // Sync localStorage cache
  useEffect(() => { winesRef.current = wines;         save(k.wines,     wines);        }, [wines, k.wines]);
  useEffect(() => { wishlistItemsRef.current = wishlistItems; save(k.wishlist, wishlistItems); }, [wishlistItems, k.wishlist]);
  useEffect(() => { shoppingItemsRef.current = shoppingItems; save(k.shopping,  shoppingItems); }, [shoppingItems, k.shopping]);
  useEffect(() => { save(k.merchants, merchants);     }, [merchants, k.merchants]);
  useEffect(() => { save(k.consumed,  consumedWines); }, [consumedWines, k.consumed]);
  useEffect(() => { save(k.movements, cellarMovements); }, [cellarMovements, k.movements]);
  useEffect(() => { saveSettings(activeEnv, settings); }, [settings, activeEnv]);

  // Load from API on mount (overrides localStorage cache with server state)
  useEffect(() => {
    api.wines.list().then((data) => { setWines(data as Wine[]); }).catch(() => {});
    api.wishlist.list().then((data) => { setWishlistItems(data as WishlistItem[]); }).catch(() => {});
    api.shopping.list().then((data) => {
      const localPriorities = new Map(shoppingItemsRef.current.map((item) => [item.id, item.priority]));
      setShoppingItems((data as ShoppingItem[]).map((item) => ({
        ...item,
        priority: item.priority ?? localPriorities.get(item.id),
      })));
    }).catch(() => {});
    api.consumed.list().then((data) => { setConsumedWines(data as ConsumedWine[]); }).catch(() => {});
  }, []);

  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);
  const localImageStorageWarning = useMemo(
    () => buildLocalImageStorageWarning(estimateStoredImageBytesTotal([...wines, ...wishlistItems])),
    [wines, wishlistItems],
  );

  const persistWines = useCallback((nextWines: Wine[]) => {
    save(k.wines, nextWines, { throwOnError: true });
    winesRef.current = nextWines;
    setWines(nextWines);
  }, [k.wines]);

  const replaceStoredWine = useCallback((id: string, updater: (wine: Wine) => Wine) => {
    const nextWines = winesRef.current.map((wine) => (wine.id === id ? updater(wine) : wine));
    save(k.wines, nextWines, { throwOnError: true });
    winesRef.current = nextWines;
    setWines(nextWines);
  }, [k.wines]);

  const syncWineImagesToStorage = useCallback(async (wine: Wine, previousWine?: Wine) => {
    const embeddedImages = (wine.images ?? []).filter(isEmbeddedImage);
    const remoteImages = (wine.images ?? []).filter((image) => !isEmbeddedImage(image));
    const previousRemoteImages = previousWine?.images?.filter((image) => !isEmbeddedImage(image)) ?? [];
    const previousRemoteIds = new Set(previousRemoteImages.map((image) => image.id));
    const nextRemoteIds = new Set(remoteImages.map((image) => image.id));
    const removedImages = previousRemoteImages.filter((image) => !nextRemoteIds.has(image.id));

    await Promise.all(removedImages.map((image) => api.wines.deleteImage(wine.id, image.id).catch(() => {})));

    const selectedPrimary = remoteImages.find((image) => image.isPrimary);
    if (selectedPrimary && previousRemoteIds.has(selectedPrimary.id)) {
      await api.wines.setPrimaryImage(wine.id, selectedPrimary.id).catch(() => {});
    }

    const uploadedImages: WineImage[] = [];
    for (const image of embeddedImages) {
      uploadedImages.push(await api.wines.uploadImage(wine.id, image));
    }

    if (uploadedImages.length > 0) {
      replaceStoredWine(wine.id, (current) => ({
        ...current,
        images: normalizePrimaryImages([...(current.images ?? []).filter((image) => !isEmbeddedImage(image)), ...uploadedImages]),
        imageData: undefined,
        imageUri: undefined,
      }));
    }
  }, [replaceStoredWine]);

  const addWine = useCallback((wine: Omit<Wine, "id">): Wine => {
    const nextWine = { ...wine, id: createId() };
    const storedWine = stripEmbeddedImages(nextWine);
    persistWines([storedWine, ...winesRef.current]);
    api.wines.upsert(storedWine)
      .then(() => syncWineImagesToStorage(nextWine))
      .catch(() => {});
    const inMovement: CellarMovement = {
      id: createId(),
      type: "in",
      wineId: nextWine.id,
      wineName: nextWine.name,
      wineProducer: nextWine.producer,
      wineVintage: nextWine.vintage,
      wineType: nextWine.type,
      quantity: nextWine.quantity,
      date: new Date().toISOString(),
    };
    setCellarMovements((prev) => [inMovement, ...prev]);
    return storedWine;
  }, [persistWines, syncWineImagesToStorage]);

  const updateWine = useCallback((id: string, updates: Partial<Wine>) => {
    const previous = winesRef.current.find((wine) => wine.id === id);
    const updatedWithLocalImages = previous ? { ...previous, ...updates } : undefined;
    const storedUpdate = updatedWithLocalImages ? stripEmbeddedImages(updatedWithLocalImages) : undefined;
    const nextWines = winesRef.current.map((wine) => (wine.id === id ? { ...wine, ...storedUpdate } : wine));
    persistWines(nextWines);
    if (updatedWithLocalImages && storedUpdate) {
      api.wines.upsert(storedUpdate)
        .then(() => syncWineImagesToStorage(updatedWithLocalImages, previous))
        .catch(() => {});
    }
  }, [persistWines, syncWineImagesToStorage]);

  const deleteWine = useCallback((id: string) => {
    const nextWines = winesRef.current.filter((wine) => wine.id !== id);
    winesRef.current = nextWines;
    setWines(nextWines);
    api.wines.delete(id).catch(() => {});
  }, []);

  const loadSampleData = useCallback(() => {
    winesRef.current = testWines;
    setWines(testWines);
  }, []);

  const resetToEmpty = useCallback(() => {
    winesRef.current = [];
    setWines([]);
  }, []);

  const addShoppingItem = useCallback((item: Omit<ShoppingItem, "id" | "checked">) => {
    const next = { ...item, id: createId(), checked: false };
    setShoppingItems((prev) => [next, ...prev]);
    api.shopping.upsert(toApiShoppingItem(next)).catch(() => {});
  }, []);

  const updateShoppingItem = useCallback((id: string, updates: Partial<ShoppingItem>) => {
    setShoppingItems((prev) => {
      const items = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      const updated = items.find((item) => item.id === id);
      if (updated) api.shopping.upsert(toApiShoppingItem(updated)).catch(() => {});
      return items;
    });
  }, []);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingItems((prev) => {
      const items = prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i));
      const updated = items.find((i) => i.id === id);
      if (updated) api.shopping.upsert(toApiShoppingItem(updated)).catch(() => {});
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
    const nextWishlistItems = wishlistItemsRef.current.map((item) => (
      item.id === id ? { ...item, ...updates } : item
    ));
    save(k.wishlist, nextWishlistItems, { throwOnError: true });
    wishlistItemsRef.current = nextWishlistItems;
    setWishlistItems(nextWishlistItems);
    const updated = nextWishlistItems.find((item) => item.id === id);
    if (updated) api.wishlist.upsert(updated).catch(() => {});
  }, [k.wishlist]);

  const removeWishlistItem = useCallback((id: string) => {
    const nextWishlistItems = wishlistItemsRef.current.filter((item) => item.id !== id);
    wishlistItemsRef.current = nextWishlistItems;
    setWishlistItems(nextWishlistItems);
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

  const consumeWine = useCallback((wine: Wine, quantity: number = 1, occasion?: string) => {
    const toConsume = Math.min(quantity, wine.quantity);
    if (wine.quantity <= toConsume) {
      const nextWines = winesRef.current.filter((entry) => entry.id !== wine.id);
      winesRef.current = nextWines;
      setWines(nextWines);
      api.wines.delete(wine.id).catch(() => {});
    } else {
      const updated = { ...wine, quantity: wine.quantity - toConsume };
      const nextWines = winesRef.current.map((entry) => (entry.id === wine.id ? updated : entry));
      winesRef.current = nextWines;
      setWines(nextWines);
      api.wines.upsert(updated).catch(() => {});
    }
    const consumed = {
      id: createId(),
      wineId: wine.id,
      name: wine.name,
      producer: wine.producer,
      vintage: wine.vintage,
      type: wine.type,
      quantity: toConsume,
      consumedDate: new Date().toISOString(),
    };
    setConsumedWines((prev) => [consumed, ...prev]);
    api.consumed.upsert(consumed).catch(() => {});
    const outMovement: CellarMovement = {
      id: createId(),
      type: "out",
      wineId: wine.id,
      wineName: wine.name,
      wineProducer: wine.producer,
      wineVintage: wine.vintage,
      wineType: wine.type,
      quantity: toConsume,
      date: new Date().toISOString(),
      occasion: occasion || undefined,
    };
    setCellarMovements((prev) => [outMovement, ...prev]);
  }, []);

  const updateSettingsFn = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <WineStoreContext.Provider value={{
      activeEnv,
      isDevEnvironment: activeEnv === "dev",
      wines, addWine, updateWine, deleteWine, loadSampleData, resetToEmpty,
      shoppingItems, addShoppingItem, updateShoppingItem, toggleShoppingItem, removeShoppingItem,
      totalBottles,
      wishlistItems, addWishlistItem, updateWishlistItem, removeWishlistItem,
      merchants, addMerchant, updateMerchant, removeMerchant,
      addDeal, updateDeal, removeDeal,
      consumedWines, consumeWine,
      cellarMovements,
      settings, updateSettings: updateSettingsFn,
      localImageStorageWarning,
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
