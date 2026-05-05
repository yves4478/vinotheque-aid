import type { Wine } from "../types/wine";
import { getWineTypeLabel } from "./wineHelpers";

export interface WineInsight {
  headline: string;
  summary: string;
  facts: string[];
  pairings: string[];
  searchUrl: string;
}

const pairingByType: Record<Wine["type"], string[]> = {
  rot: ["Geschmortes Fleisch", "Pilzgerichte", "gereifter Hartkaese"],
  weiss: ["Fisch", "helles Fleisch", "Gemuese mit Kraeutern"],
  "rosé": ["Antipasti", "Sommerkueche", "milde Tapas"],
  schaumwein: ["Apero", "Meeresfruechte", "frittierte Kleinigkeiten"],
  dessert: ["Fruchtdesserts", "Blauschimmelkaese", "nicht zu suesse Desserts"],
};

export function buildWineInsight(wine: Wine): WineInsight {
  const typeLabel = getWineTypeLabel(wine.type);
  const origin = [wine.region, wine.country].filter(Boolean).join(", ");
  const grape = wine.grape ? ` aus ${wine.grape}` : "";
  const windowText = wine.drinkFrom && wine.drinkUntil
    ? ` Das Trinkfenster liegt bei ${wine.drinkFrom}-${wine.drinkUntil}.`
    : "";

  const summary = `${wine.name} von ${wine.producer} ist ein ${typeLabel}${grape}${origin ? ` aus ${origin}` : ""}. Der Jahrgang ${wine.vintage} sollte anhand von Produzenten- und Regionsinformationen geprueft werden.${windowText}`;
  const searchQuery = [
    wine.producer,
    wine.name,
    wine.vintage,
    wine.region,
    wine.country,
    "wine information tasting notes",
  ].filter(Boolean).join(" ");

  return {
    headline: `${wine.name} recherchieren`,
    summary,
    facts: [
      `Produzent: ${wine.producer}`,
      `Herkunft: ${origin || "Noch nicht erfasst"}`,
      `Jahrgang: ${wine.vintage}`,
      `Rebsorte: ${wine.grape || "Noch nicht erfasst"}`,
      wine.rating ? `Tester-Rating: ${wine.ratingSource ? `${wine.ratingSource} ` : ""}${wine.rating}/100` : "Tester-Rating: Noch nicht erfasst",
    ],
    pairings: pairingByType[wine.type],
    searchUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
  };
}
