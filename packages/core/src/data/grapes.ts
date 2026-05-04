import { wineRegions } from "./wineRegions";

export const OTHER_GRAPE_OPTION = "__other_grape__";

export type GrapeEntryMode = "single" | "assemblage" | "other";
export type GrapeSelectorMode = Exclude<GrapeEntryMode, "other">;

export const ASSEMBLAGE_MIN_GRAPES = 2;

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

export function getInitialGrapeEntryMode(value: string, knownGrapes: Iterable<string> = allGrapes): GrapeEntryMode {
  const grapes = parseGrapeList(value);
  if (grapes.length > 1) return "assemblage";
  if (grapes.length === 1 && !new Set(knownGrapes).has(grapes[0])) return "other";
  return "single";
}

export function addGrapeToSelection(value: string, grape: string): string {
  const next = grape.trim();
  if (!next) return formatGrapeList(parseGrapeList(value));
  return formatGrapeList(new Set([...parseGrapeList(value), next]));
}

export function removeGrapeFromSelection(value: string, grape: string): string {
  return formatGrapeList(parseGrapeList(value).filter((entry) => entry !== grape));
}

export function isAssemblageComplete(value: string): boolean {
  return parseGrapeList(value).length >= ASSEMBLAGE_MIN_GRAPES;
}

export function getAssemblageRequirementText(value: string): string | undefined {
  const count = parseGrapeList(value).length;
  if (count >= ASSEMBLAGE_MIN_GRAPES) return undefined;
  return count === 1
    ? "Assemblage braucht mindestens 2 Trauben."
    : "Assemblage braucht 2 oder mehr Trauben.";
}
