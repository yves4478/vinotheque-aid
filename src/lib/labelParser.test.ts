import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isDraftWeak,
  MIN_RECOGNIZED_VINTAGE_YEAR,
  parseWineLabel,
} from "@vinotheque/core";

describe("labelParser", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("extracts vintage and ignores obvious noise lines", () => {
    const draft = parseWineLabel([
      "2018",
      "Giacomo Conterno",
      "Barolo Riserva",
      "14.5% vol",
      "75 cl",
      "contains sulfites",
      "www.example.com",
    ].join("\n"));

    expect(draft.fields.vintage).toEqual({ value: 2018, confidence: "high" });
    expect(draft.fields.producer).toEqual({ value: "Giacomo Conterno", confidence: "low" });
    expect(draft.fields.name).toEqual({ value: "Barolo Riserva", confidence: "low" });
    expect(isDraftWeak(draft)).toBe(true);
    expect(draft.warnings).toEqual([]);
  });

  it("warns when no useful OCR content survives the noise filter", () => {
    const draft = parseWineLabel([
      "14.0% vol",
      "75 cl",
      "contains sulfites",
      "www.vin.example",
    ].join("\n"));

    expect(draft.fields).toEqual({});
    expect(draft.warnings).toContain("Keine auswertbaren Textzeilen erkannt.");
    expect(isDraftWeak(draft)).toBe(true);
  });

  it("supports vintages through 2030 once the current year reaches them", () => {
    vi.setSystemTime(new Date("2030-09-01T12:00:00Z"));

    const draft = parseWineLabel([
      "2030",
      "Weingut Muster",
      "Pinot Noir",
    ].join("\n"));

    expect(draft.fields.vintage).toEqual({ value: 2030, confidence: "high" });
    expect(draft.fields.producer?.value).toBe("Weingut Muster");
  });

  it("keeps the minimum vintage boundary at 1950", () => {
    const draft = parseWineLabel([
      String(MIN_RECOGNIZED_VINTAGE_YEAR - 1),
      "Domaine Test",
      "Cuvee Speciale",
    ].join("\n"));

    expect(draft.fields.vintage).toBeUndefined();
    expect(draft.fields.producer?.value).toBe("Domaine Test");
    expect(draft.fields.name?.value).toBe("Cuvee Speciale");
  });
});
