import { buildVivinoWishlistItem, extractImportUrl, isVivinoUrl } from "@/lib/wishlistImport";

describe("wishlistImport", () => {
  test("extracts the first URL from shared text", () => {
    expect(
      extractImportUrl("Schau dir diesen Wein an: https://www.vivino.com/CH/de/w/12345?t=abc"),
    ).toBe("https://www.vivino.com/CH/de/w/12345?t=abc");
  });

  test("accepts Vivino domains and rejects unrelated URLs", () => {
    expect(isVivinoUrl("https://www.vivino.com/US/en/wines/123")).toBe(true);
    expect(isVivinoUrl("https://vivino.app.link/abc123")).toBe(true);
    expect(isVivinoUrl("https://notvivino.com/wines/123")).toBe(false);
    expect(isVivinoUrl("https://example.com/wines/123")).toBe(false);
  });

  test("maps imported data into a wishlist item", () => {
    expect(buildVivinoWishlistItem({
      name: "  Barolo Riserva  ",
      producer: "Giacomo Conterno",
      vintage: 2016,
      region: "Piemont",
      country: "Italien",
      type: "rot",
      grape: "Nebbiolo",
      rating: 4.6,
      purchasePrice: 89,
      notes: "  Kraftvoll und komplex  ",
    }, "https://www.vivino.com/wines/123")).toEqual({
      name: "Barolo Riserva",
      producer: "Giacomo Conterno",
      vintage: 2016,
      region: "Piemont",
      country: "Italien",
      type: "rot",
      grape: "Nebbiolo",
      rating: 4.6,
      price: 89,
      notes: "Kraftvoll und komplex",
      location: "",
      occasion: "",
      companions: "",
      source: "vivino",
      sourceUrl: "https://www.vivino.com/wines/123",
    });
  });
});
