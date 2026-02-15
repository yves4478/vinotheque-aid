import { createContext, useContext, useCallback, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PantryItem } from "@/data/pantry";
import * as api from "@/lib/api";

export type { PantryItem } from "@/data/pantry";

interface PantryStoreContextType {
  items: PantryItem[];
  isLoading: boolean;
  addItem: (item: Omit<PantryItem, "id">) => void;
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  deleteItem: (id: string) => void;
  totalItems: number;
  shoppingItems: api.PantryShoppingItem[];
  addShoppingItem: (item: Omit<api.PantryShoppingItem, "id" | "checked">) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
}

const PantryStoreContext = createContext<PantryStoreContextType | null>(null);

export function PantryStoreProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  // --- Pantry Items ---
  const itemsQuery = useQuery({
    queryKey: ["pantry"],
    queryFn: api.fetchPantryItems,
  });

  const items = itemsQuery.data ?? [];
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const addItemMut = useMutation({
    mutationFn: (item: Omit<PantryItem, "id">) => api.createPantryItem(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
  });

  const updateItemMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PantryItem> }) =>
      api.updatePantryItem(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
  });

  const deleteItemMut = useMutation({
    mutationFn: (id: string) => api.deletePantryItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantry"] }),
  });

  // --- Pantry Shopping ---
  const shoppingQuery = useQuery({
    queryKey: ["pantry-shopping"],
    queryFn: api.fetchPantryShopping,
  });

  const shoppingItems = shoppingQuery.data ?? [];

  const addShoppingMut = useMutation({
    mutationFn: (item: Omit<api.PantryShoppingItem, "id" | "checked">) =>
      api.createPantryShoppingItem(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantry-shopping"] }),
  });

  const toggleShoppingMut = useMutation({
    mutationFn: (id: string) => {
      const item = shoppingItems.find((i) => i.id === id);
      return api.togglePantryShoppingItem(id, !item?.checked);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantry-shopping"] }),
  });

  const removeShoppingMut = useMutation({
    mutationFn: (id: string) => api.deletePantryShoppingItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pantry-shopping"] }),
  });

  // --- Stable callbacks ---
  const addItem = useCallback(
    (item: Omit<PantryItem, "id">) => addItemMut.mutate(item),
    [addItemMut]
  );
  const updateItemFn = useCallback(
    (id: string, updates: Partial<PantryItem>) => updateItemMut.mutate({ id, updates }),
    [updateItemMut]
  );
  const deleteItemFn = useCallback(
    (id: string) => deleteItemMut.mutate(id),
    [deleteItemMut]
  );
  const addShoppingItem = useCallback(
    (item: Omit<api.PantryShoppingItem, "id" | "checked">) => addShoppingMut.mutate(item),
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

  return (
    <PantryStoreContext.Provider
      value={{
        items,
        isLoading: itemsQuery.isLoading,
        addItem,
        updateItem: updateItemFn,
        deleteItem: deleteItemFn,
        totalItems,
        shoppingItems,
        addShoppingItem,
        toggleShoppingItem: toggleShoppingItemFn,
        removeShoppingItem,
      }}
    >
      {children}
    </PantryStoreContext.Provider>
  );
}

export function usePantryStore() {
  const ctx = useContext(PantryStoreContext);
  if (!ctx) throw new Error("usePantryStore must be used within PantryStoreProvider");
  return ctx;
}
