import { wineRegions } from "./wineRegions";

export const OTHER_GRAPE_OPTION = "__other_grape__";

export type GrapeEntryMode = "single" | "assemblage" | "other";

function sortGrapes(grapes: Iterable<string>): string[] {
  return Array.from(grapes).sort((a, b) => a.localeCompare(b, "de"));
}

export const allGrapes: string[] = (() => {
  const grapes = new Set<string>();
  for (const region of wineRegions) {
    for (const grape of region.grapes) grapes.add(grape);
  }
  return sortGrapes(grapes);
})();

export function getGrapesForCountry(country?: string): string[] {
  if (!country?.trim()) return allGrapes;

  const grapes = new Set<string>();
  for (const region of wineRegions) {
    if (region.country === country) {
      for (const grape of region.grapes) grapes.add(grape);
    }
  }

  return grapes.size > 0 ? sortGrapes(grapes) : allGrapes;
}

export function parseGrapeList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function formatGrapeList(grapes: Iterable<string>): string {
  return sortGrapes(grapes).join(", ");
}
