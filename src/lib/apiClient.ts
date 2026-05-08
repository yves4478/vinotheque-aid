import type { FeatureFlags, RuntimeConfig, WineImage } from "@vinotheque/core";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = init?.body instanceof FormData
    ? init.headers
    : { "Content-Type": "application/json", ...init?.headers };
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) throw new Error(`API ${init?.method ?? "GET"} ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  wines: {
    list: () => request<unknown[]>("/api/wines"),
    upsert: (data: unknown) => request("/api/wines", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/wines/${id}`, { method: "DELETE" }),
    uploadImage: (wineId: string, image: WineImage) => {
      const formData = new FormData();
      formData.append("image", dataUriToFile(image.uri, `${image.id}.jpg`));
      if (image.label) formData.append("label", image.label);
      if (image.isPrimary) formData.append("isPrimary", "true");
      return request<WineImage>(`/api/wines/${wineId}/images`, {
        method: "POST",
        body: formData,
      });
    },
    deleteImage: (wineId: string, imageId: string) =>
      request(`/api/wines/${wineId}/images/${imageId}`, { method: "DELETE" }),
    setPrimaryImage: (wineId: string, imageId: string) =>
      request(`/api/wines/${wineId}/images/${imageId}/primary`, { method: "POST" }),
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

function dataUriToFile(dataUri: string, fallbackName: string): File {
  const [meta, base64 = ""] = dataUri.split(",");
  const mime = meta.match(/^data:(.*?);base64$/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fallbackName, { type: mime });
}
