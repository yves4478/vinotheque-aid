// Pure helper functions extracted from src/data/wines.ts

import type { Wine, WineType } from "../types/wine";
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
