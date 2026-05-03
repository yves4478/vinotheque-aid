import type { FeatureFlags, RuntimeConfig } from "@vinotheque/core";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${init?.method ?? "GET"} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  wines: {
    list: () => request<unknown[]>("/api/wines"),
    upsert: (data: unknown) => request("/api/wines", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/wines/${id}`, { method: "DELETE" }),
  },
  wishlist: {
    list: () => request<unknown[]>("/api/wishlist"),
    upsert: (data: unknown) => request("/api/wishlist", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/wishlist/${id}`, { method: "DELETE" }),
  },
  shopping: {
    list: () => request<unknown[]>("/api/shopping"),
    upsert: (data: unknown) => request("/api/shopping", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/shopping/${id}`, { method: "DELETE" }),
  },
  consumed: {
    list: () => request<unknown[]>("/api/consumed"),
    upsert: (data: unknown) => request("/api/consumed", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/consumed/${id}`, { method: "DELETE" }),
  },
  config: {
    runtime: () => request<RuntimeConfig>("/api/runtime-config"),
    updateRuntime: (featureFlags: Partial<FeatureFlags>) =>
      request<RuntimeConfig>("/api/runtime-config", {
        method: "PUT",
        body: JSON.stringify({ featureFlags }),
      }),
  },
};
