import type { WishlistItem } from "@/data/wines";
import type { ImportedWineData } from "@/lib/wineUrlParser";

const URL_REGEX = /https?:\/\/\S+/i;

export function extractImportUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const match = trimmed.match(URL_REGEX);
  const candidate = match ? match[0] : trimmed;
  return candidate.replace(/["'<>)\],.]+$/, "");
}

export function isVivinoUrl(input: string): boolean {
  try {
    const url = new URL(input);
    const hostParts = url.hostname.toLowerCase().split(".");
    return ["http:", "https:"].includes(url.protocol) && hostParts.includes("vivino");
  } catch {
    return false;
  }
}

export function buildVivinoWishlistItem(
  data: ImportedWineData,
  sourceUrl: string,
): Omit<WishlistItem, "id" | "createdAt"> {
  const name = data.name?.trim();

  if (!name) {
    throw new Error("Im Vivino-Link konnte kein Weinname erkannt werden.");
  }

  return {
    name,
    producer: data.producer?.trim() || undefined,
    vintage: data.vintage,
    type: data.type,
    region: data.region?.trim() || undefined,
    country: data.country?.trim() || undefined,
    grape: data.grape?.trim() || undefined,
    rating: data.rating,
    price: data.purchasePrice,
    notes: data.notes?.trim() || undefined,
    location: "",
    occasion: "",
    companions: "",
    source: "vivino",
    sourceUrl,
  };
}
