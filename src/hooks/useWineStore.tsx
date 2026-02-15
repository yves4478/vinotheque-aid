import { createContext, useContext, useCallback, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wine } from "@/data/wines";
import * as api from "@/lib/api";

export type { AppSettings, ShoppingItem } from "@/lib/api";

interface WineStoreContextType {
  wines: Wine[];
  isLoading: boolean;
  addWine: (wine: Omit<Wine, "id">) => void;
  updateWine: (id: string, updates: Partial<Wine>) => void;
  deleteWine: (id: string) => void;
  shoppingItems: api.ShoppingItem[];
  addShoppingItem: (item: Omit<api.ShoppingItem, "id" | "checked">) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  totalBottles: number;
  settings: api.AppSettings;
  updateSettings: (updates: Partial<api.AppSettings>) => void;
}

const WineStoreContext = createContext<WineStoreContextType | null>(null);

const DEFAULT_SETTINGS: api.AppSettings = { cellarName: "Yves Weinkeller" };

export function WineStoreProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  // --- Wines ---
  const winesQuery = useQuery({
    queryKey: ["wines"],
    queryFn: api.fetchWines,
  });

  const wines = winesQuery.data ?? [];
  const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0);

  const addWineMut = useMutation({
    mutationFn: (wine: Omit<Wine, "id">) => api.createWine(wine),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wines"] }),
  });

  const updateWineMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Wine> }) =>
      api.updateWine(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wines"] }),
  });

  const deleteWineMut = useMutation({
    mutationFn: (id: string) => api.deleteWine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wines"] }),
  });

  // --- Shopping ---
  const shoppingQuery = useQuery({
    queryKey: ["shopping"],
    queryFn: api.fetchShopping,
  });

  const shoppingItems = shoppingQuery.data ?? [];

  const addShoppingMut = useMutation({
    mutationFn: (item: Omit<api.ShoppingItem, "id" | "checked">) =>
      api.createShoppingItem(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });

  const toggleShoppingMut = useMutation({
    mutationFn: (id: string) => {
      const item = shoppingItems.find((i) => i.id === id);
      return api.toggleShoppingItem(id, !item?.checked);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });

  const removeShoppingMut = useMutation({
    mutationFn: (id: string) => api.deleteShoppingItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shopping"] }),
  });

  // --- Settings ---
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.fetchSettings,
  });

  const settings = settingsQuery.data ?? DEFAULT_SETTINGS;

  const updateSettingsMut = useMutation({
    mutationFn: (updates: Partial<api.AppSettings>) =>
      api.updateSettings(updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  // --- Stable callback wrappers ---
  const addWine = useCallback(
    (wine: Omit<Wine, "id">) => addWineMut.mutate(wine),
    [addWineMut]
  );
  const updateWineFn = useCallback(
    (id: string, updates: Partial<Wine>) =>
      updateWineMut.mutate({ id, updates }),
    [updateWineMut]
  );
  const deleteWineFn = useCallback(
    (id: string) => deleteWineMut.mutate(id),
    [deleteWineMut]
  );
  const addShoppingItem = useCallback(
    (item: Omit<api.ShoppingItem, "id" | "checked">) =>
      addShoppingMut.mutate(item),
    [addShoppingMut]
  );
  const toggleShoppingItemFn = useCallback(
    (id: string) => toggleShoppingMut.mutate(id),
    [toggleShoppingMut]
  );
  const removeShoppingItem = useCallback(
    (id: string) => removeShoppingMut.mutate(id),
    [removeShoppingMut]
  );
  const updateSettingsFn = useCallback(
    (updates: Partial<api.AppSettings>) => updateSettingsMut.mutate(updates),
    [updateSettingsMut]
  );

  return (
    <WineStoreContext.Provider
      value={{
        wines,
        isLoading: winesQuery.isLoading,
        addWine,
        updateWine: updateWineFn,
        deleteWine: deleteWineFn,
        shoppingItems,
        addShoppingItem,
        toggleShoppingItem: toggleShoppingItemFn,
        removeShoppingItem,
        totalBottles,
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
