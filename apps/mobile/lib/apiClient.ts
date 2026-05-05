// API_URL: in dev the iOS Simulator reaches the Mac's localhost directly.
// In production set EXPO_PUBLIC_API_URL=https://api.vinotheque.ch
const BASE =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ??
  "http://localhost:3000";

export interface SharedSettingsPayload {
  cellarName?: string;
  featureFlags?: Record<string, boolean>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${init?.method ?? "GET"} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  wines: {
    list: () => request<unknown[]>("/api/wines"),
    upsert: (data: unknown) =>
      request("/api/wines", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/api/wines/${id}`, { method: "DELETE" }),
  },
  wishlist: {
    list: () => request<unknown[]>("/api/wishlist"),
    upsert: (data: unknown) =>
      request("/api/wishlist", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/api/wishlist/${id}`, { method: "DELETE" }),
  },
  shopping: {
    list: () => request<unknown[]>("/api/shopping"),
    upsert: (data: unknown) =>
      request("/api/shopping", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/api/shopping/${id}`, { method: "DELETE" }),
  },
  consumed: {
    list: () => request<unknown[]>("/api/consumed"),
    upsert: (data: unknown) =>
      request("/api/consumed", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/api/consumed/${id}`, { method: "DELETE" }),
  },
  settings: {
    get: () => request<SharedSettingsPayload>("/api/settings"),
    update: (data: SharedSettingsPayload) =>
      request<SharedSettingsPayload>("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
  },
};
