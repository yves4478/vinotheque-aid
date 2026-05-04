import type { Wine, WishlistItem } from "../types/wine";

export const MAX_WINE_IMAGES = 3;
export const WEB_IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const WEB_TASTING_IMAGE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 800;
export const IMAGE_COMPRESSION_QUALITY = 0.72;
export const LOCAL_IMAGE_STORAGE_WARNING_BYTES = 3_500_000;
export const IMAGE_JSON_MAX_BYTES = 3 * 1024 * 1024;

type LegacyImageItem =
  | Pick<Wine, "images" | "imageData" | "imageUri" | "imageUrl">
  | Pick<WishlistItem, "images" | "imageData" | "imageUri">;

export function isDataImageUri(uri: string | undefined): uri is string {
  return typeof uri === "string" && uri.startsWith("data:image/");
}

export function estimateDataImageBytes(uri: string | undefined): number {
  if (!isDataImageUri(uri)) return 0;

  const base64 = uri.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

export function estimateStoredImageBytes(item: LegacyImageItem): number {
  const uris = new Set<string>();

  for (const image of item.images ?? []) {
    if (image.uri) uris.add(image.uri);
  }

  if ("imageData" in item && item.imageData) uris.add(item.imageData);
  if ("imageUri" in item && item.imageUri) uris.add(item.imageUri);
  if ("imageUrl" in item && item.imageUrl) uris.add(item.imageUrl);

  return Array.from(uris).reduce((sum, uri) => sum + estimateDataImageBytes(uri), 0);
}

export function estimateStoredImageBytesTotal(items: LegacyImageItem[]): number {
  return items.reduce((sum, item) => sum + estimateStoredImageBytes(item), 0);
}

export function formatByteSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.ceil(bytes / 1024)} KB`;
}

export function buildLocalImageStorageWarning(bytes: number): string | undefined {
  if (bytes < LOCAL_IMAGE_STORAGE_WARNING_BYTES) return undefined;

  return `Der lokale Bildspeicher liegt bereits bei ca. ${formatByteSize(bytes)}. Ohne Cloud-Storage kann der Browser bald an seine Grenzen kommen.`;
}
