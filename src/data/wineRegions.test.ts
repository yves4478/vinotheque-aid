import { describe, expect, it } from "vitest";

import { getWineStylesForRegion, matchWineOriginToRegion, normalizeOriginName, wineRegions } from "./wineRegions";

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

  it("does not match the same region name in the wrong country", () => {
    expect(matchWineOriginToRegion({ country: "Chile", region: "Mendoza" })).toBeUndefined();
  });

  it("returns typical wine styles for a mapped region", () => {
    const provence = wineRegions.find((region) => region.id === "provence");
    expect(provence).toBeDefined();
    expect(getWineStylesForRegion(provence!)).toContain("rosé");
  });
});
