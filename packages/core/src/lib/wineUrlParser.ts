// TODO (transfer agent): copy full content from src/lib/wineUrlParser.ts
// Uses URL and fetch — both available in React Native, no changes needed.
// Remove the CORS proxy workaround if present — mobile fetch has no CORS restrictions.

export interface ImportedWineData {
  name?: string;
  producer?: string;
  vintage?: number;
  type?: "rot" | "weiss" | "rosé" | "schaumwein" | "dessert";
  region?: string;
  country?: string;
  grape?: string;
  rating?: number;
  imageUrl?: string;
}

export async function parseWineUrl(_url: string): Promise<ImportedWineData> {
  throw new Error("Not implemented — transfer agent fills this");
}
