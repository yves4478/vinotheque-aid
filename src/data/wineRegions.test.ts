import { describe, expect, it } from "vitest";

import { countryRegions, getRegionsForCountry } from "./countryRegions";
import { getWineRegionGuide, getWineStylesForRegion, matchWineOriginToRegion, normalizeOriginName, wineRegions } from "./wineRegions";

describe("wine region origin matching", () => {
  it("normalizes accents and punctuation for region names", () => {
    expect(normalizeOriginName("Rhône")).toBe("rhone");
    expect(normalizeOriginName("Hawke's Bay")).toBe("hawke s bay");
  });

  it("matches a cellar origin by country and normalized region", () => {
    expect(matchWineOriginToRegion({ country: "Frankreich", region: "Rhone" })?.id).toBe("rhone");
  });

  it("matches parenthetical region catalog entries with a shorter cellar region", () => {
    expect(matchWineOriginToRegion({ country: "Schweiz", region: "Waadt" })?.id).toBe("waadt");
  });

  it("matches the alias inside parenthetical Swiss region names", () => {
    expect(matchWineOriginToRegion({ country: "Schweiz", region: "Lavaux" })?.id).toBe("waadt");
  });

  it("does not match the same region name in the wrong country", () => {
    expect(matchWineOriginToRegion({ country: "Chile", region: "Mendoza" })).toBeUndefined();
  });

  it("returns typical wine styles for a mapped region", () => {
    const provence = wineRegions.find((region) => region.id === "provence");
    expect(provence).toBeDefined();
    expect(getWineStylesForRegion(provence!)).toContain("rosé");
  });

  it("covers every configured country region in the map catalog", () => {
    for (const entry of countryRegions) {
      for (const regionName of getRegionsForCountry(entry.country)) {
        const region = matchWineOriginToRegion({ country: entry.country, region: regionName });
        expect(region?.country).toBe(entry.country);
        expect(getWineStylesForRegion(region!)).not.toHaveLength(0);
      }
    }
  });

  it("provides a Douro guide for the main Port wine styles", () => {
    const douro = wineRegions.find((region) => region.id === "douro");
    expect(douro).toBeDefined();

    const guide = getWineRegionGuide(douro!);
    expect(guide?.entries.length).toBeGreaterThanOrEqual(6);
    expect(guide?.entries.some((entry) => entry.title.includes("Vintage"))).toBe(true);
    expect(guide?.entries.some((entry) => entry.title.includes("Tawny"))).toBe(true);
    expect(guide?.entries.some((entry) => entry.title.includes("White"))).toBe(true);
  });

  it("matches generated catalog entries beyond the original starter set", () => {
    expect(matchWineOriginToRegion({ country: "Frankreich", region: "Jura" })?.name).toBe("Jura");
    expect(matchWineOriginToRegion({ country: "England", region: "Kent" })?.name).toBe("Kent");
    expect(matchWineOriginToRegion({ country: "Portugal", region: "Madeira" })?.name).toBe("Madeira");
    expect(matchWineOriginToRegion({ country: "Kanada", region: "Niagara Peninsula" })?.name).toBe("Niagara Peninsula");
  });

  it("exposes the full configured country count in the map catalog", () => {
    const countriesInMap = new Set(wineRegions.map((region) => region.country));
    for (const entry of countryRegions) {
      expect(countriesInMap.has(entry.country)).toBe(true);
    }
  });
});
