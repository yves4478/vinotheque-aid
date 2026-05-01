import type { WineType } from "../types/wine";

export type RecognitionConfidence = "high" | "medium" | "low";
export const MIN_RECOGNIZED_VINTAGE_YEAR = 1950;

export interface RecognizedField<T> {
  value: T;
  confidence: RecognitionConfidence;
}

export interface RecognizedWineDraft {
  rawText: string;
  fields: {
    producer?: RecognizedField<string>;
    name?: RecognizedField<string>;
    vintage?: RecognizedField<number>;
    region?: RecognizedField<string>;
    country?: RecognizedField<string>;
    type?: RecognizedField<WineType>;
    grape?: RecognizedField<string>;
  };
  warnings: string[];
}

const YEAR_PATTERN = /\b(19[5-9]\d|20\d{2})\b/;

const NOISE_PATTERNS = [
  /^\d+$/,
  /^\d+[.,]\d+$/,
  /%\s*vol/i,
  /\d+\s*(cl|ml|l)\b/i,
  /appellation/i,
  /contr[oô]l[eé]e/i,
  /mis en bouteille/i,
  /contains?\s+sulfit/i,
  /enth[aä]lt sulfite/i,
  /product of/i,
  /www\./i,
  /\.(com|ch|de|fr|it|es)\b/i,
];

export function parseWineLabel(rawText: string): RecognizedWineDraft {
  const currentYear = new Date().getFullYear();
  const warnings: string[] = [];

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // Vintage — high confidence: clear 4-digit year in expected range
  let vintage: RecognizedField<number> | undefined;
  for (const line of lines) {
    const match = line.match(YEAR_PATTERN);
    if (match) {
      const y = parseInt(match[1], 10);
      if (y >= MIN_RECOGNIZED_VINTAGE_YEAR && y <= currentYear) {
        vintage = { value: y, confidence: "high" };
        break;
      }
    }
  }

  // Filter noise lines
  const contentLines = lines.filter(
    (l) => l.length >= 3 && !NOISE_PATTERNS.some((p) => p.test(l)),
  );

  // Remove lines that consist only of a year (already captured above)
  const withoutVintage = contentLines.filter(
    (l) => !l.match(YEAR_PATTERN) || l.replace(YEAR_PATTERN, "").trim().length > 3,
  );

  // Producer and name — medium confidence, positional heuristic only.
  // Richer fields like region/country/type/grape are intentionally left to the
  // Claude Vision fallback until we have better OCR-side heuristics.
  let producer: RecognizedField<string> | undefined;
  let name: RecognizedField<string> | undefined;

  if (withoutVintage[0]) {
    producer = { value: withoutVintage[0], confidence: "medium" };
  }
  if (withoutVintage[1]) {
    name = { value: withoutVintage[1], confidence: "medium" };
  }

  if (!vintage && !producer && !name) {
    warnings.push("Keine auswertbaren Textzeilen erkannt.");
  }

  return {
    rawText,
    fields: {
      ...(producer && { producer }),
      ...(name && { name }),
      ...(vintage && { vintage }),
    },
    warnings,
  };
}

export function isDraftWeak(draft: RecognizedWineDraft): boolean {
  return Object.keys(draft.fields).length < 2 || draft.warnings.length > 0;
}
