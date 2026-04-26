// Pure helper functions extracted from src/data/wines.ts

import type { Wine, WineImage, WineType, WishlistItem } from "../types/wine";
import { BOTTLE_SIZES } from "../types/wine";

export function getBottleSizeLabel(size?: string): string {
  const found = BOTTLE_SIZES.find((b) => b.value === size);
  return found ? found.label : "Standard (0.75L)";
}

export function isLargeFormat(size?: string): boolean {
  return !!size && size !== "standard";
}

export function getWineTypeLabel(type: WineType): string {
  switch (type) {
    case "rot":        return "Rotwein";
    case "weiss":      return "Weisswein";
    case "rosé":       return "Rosé";
    case "schaumwein": return "Schaumwein";
    case "dessert":    return "Dessertwein";
  }
}

export function getDrinkStatus(wine: Wine): { label: string; status: "lagern" | "trinkreif" | "ueberschritten" } {
  const year = new Date().getFullYear();
  if (year < wine.drinkFrom)  return { label: "Noch lagern",   status: "lagern" };
  if (year <= wine.drinkUntil) return { label: "Trinkreif",    status: "trinkreif" };
  return                                { label: "Überschritten", status: "ueberschritten" };
}

export function createWineImage(uri: string, label?: WineImage["label"], isPrimary = false): WineImage {
  return {
    id: `image-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    uri,
    label,
    isPrimary,
    createdAt: new Date().toISOString(),
  };
}

export function getWineImages(item: Pick<Wine, "images" | "imageUri" | "imageUrl" | "imageData"> | Pick<WishlistItem, "images" | "imageUri" | "imageData">): WineImage[] {
  const explicit = item.images?.filter((image) => image.uri).slice(0, 3) ?? [];
  if (explicit.length > 0) return explicit;

  const legacyUri = "imageData" in item && item.imageData
    ? item.imageData
    : "imageUri" in item && item.imageUri
      ? item.imageUri
      : "imageUrl" in item
        ? item.imageUrl
        : undefined;

  return legacyUri
    ? [{ id: "legacy-image", uri: legacyUri, label: "Flasche", isPrimary: true }]
    : [];
}

export function getPrimaryWineImage(item: Pick<Wine, "images" | "imageUri" | "imageUrl" | "imageData"> | Pick<WishlistItem, "images" | "imageUri" | "imageData">): WineImage | undefined {
  const images = getWineImages(item);
  return images.find((image) => image.isPrimary) ?? images[0];
}
