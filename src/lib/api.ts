import type { Wine } from "@/data/wines";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Wines ---

export function fetchWines(): Promise<Wine[]> {
  return request<Wine[]>("/wines");
}

export function createWine(wine: Omit<Wine, "id">): Promise<Wine> {
  return request<Wine>("/wines", {
    method: "POST",
    body: JSON.stringify(wine),
  });
}

export function updateWine(id: string, updates: Partial<Wine>): Promise<Wine> {
  return request<Wine>(`/wines/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function deleteWine(id: string): Promise<void> {
  return request<void>(`/wines/${id}`, { method: "DELETE" });
}

// --- Shopping ---

export interface ShoppingItem {
  id: string;
  name: string;
  producer: string;
  quantity: number;
  estimatedPrice: number;
  reason: string;
  checked: boolean;
}

export function fetchShopping(): Promise<ShoppingItem[]> {
  return request<ShoppingItem[]>("/shopping");
}

export function createShoppingItem(
  item: Omit<ShoppingItem, "id" | "checked">
): Promise<ShoppingItem> {
  return request<ShoppingItem>("/shopping", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export function toggleShoppingItem(
  id: string,
  checked: boolean
): Promise<ShoppingItem> {
  return request<ShoppingItem>(`/shopping/${id}`, {
    method: "PUT",
    body: JSON.stringify({ checked }),
  });
}

export function deleteShoppingItem(id: string): Promise<void> {
  return request<void>(`/shopping/${id}`, { method: "DELETE" });
}

// --- Settings ---

export interface AppSettings {
  cellarName: string;
}

export function fetchSettings(): Promise<AppSettings> {
  return request<AppSettings>("/settings");
}

export function updateSettings(
  settings: Partial<AppSettings>
): Promise<AppSettings> {
  return request<AppSettings>("/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}
