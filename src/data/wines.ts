export interface Wine {
  id: string;
  name: string;
  producer: string;
  vintage: number;
  region: string;
  country: string;
  type: "rot" | "weiss" | "rosé" | "schaumwein" | "dessert";
  grape: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  purchaseLocation: string;
  drinkFrom: number;
  drinkUntil: number;
  rating?: number;
  personalRating?: number;
  notes?: string;
  imageUrl?: string;
  isGift?: boolean;
  giftFrom?: string;
}

export const mockWines: Wine[] = [
  {
    id: "1",
    name: "Barolo Riserva",
    producer: "Giacomo Conterno",
    vintage: 2016,
    region: "Piemont",
    country: "Italien",
    type: "rot",
    grape: "Nebbiolo",
    quantity: 3,
    purchasePrice: 89,
    purchaseDate: "2021-05-15",
    purchaseLocation: "Weinhandlung Kreis",
    drinkFrom: 2024,
    drinkUntil: 2040,
    rating: 96,
    personalRating: 5,
    notes: "Komplex, Trüffel, Teer, getrocknete Rosenblätter",
  },
  {
    id: "2",
    name: "Grüner Veltliner Smaragd",
    producer: "F.X. Pichler",
    vintage: 2022,
    region: "Wachau",
    country: "Österreich",
    type: "weiss",
    grape: "Grüner Veltliner",
    quantity: 6,
    purchasePrice: 42,
    purchaseDate: "2023-03-20",
    purchaseLocation: "Vinothek am Naschmarkt",
    drinkFrom: 2023,
    drinkUntil: 2030,
    rating: 93,
    personalRating: 4,
    notes: "Mineralisch, weisser Pfeffer, Zitrus",
  },
  {
    id: "3",
    name: "Châteauneuf-du-Pape",
    producer: "Château Rayas",
    vintage: 2019,
    region: "Rhône",
    country: "Frankreich",
    type: "rot",
    grape: "Grenache",
    quantity: 2,
    purchasePrice: 120,
    purchaseDate: "2022-11-01",
    purchaseLocation: "Wine & Co Online",
    drinkFrom: 2025,
    drinkUntil: 2045,
    rating: 98,
    notes: "Noch lagern! Enorme Konzentration",
  },
  {
    id: "4",
    name: "Riesling Auslese",
    producer: "Joh. Jos. Prüm",
    vintage: 2020,
    region: "Mosel",
    country: "Deutschland",
    type: "weiss",
    grape: "Riesling",
    quantity: 4,
    purchasePrice: 35,
    purchaseDate: "2021-09-10",
    purchaseLocation: "Weinhaus Becker",
    drinkFrom: 2023,
    drinkUntil: 2050,
    rating: 94,
    personalRating: 5,
    notes: "Honigsüss, Schiefer, perfekte Balance",
  },
  {
    id: "5",
    name: "Franciacorta Brut",
    producer: "Ca' del Bosco",
    vintage: 2018,
    region: "Lombardei",
    country: "Italien",
    type: "schaumwein",
    grape: "Chardonnay, Pinot Noir",
    quantity: 8,
    purchasePrice: 28,
    purchaseDate: "2024-01-05",
    purchaseLocation: "Metro",
    drinkFrom: 2020,
    drinkUntil: 2026,
    rating: 91,
    personalRating: 4,
    notes: "Elegante Perlage, Brioche, Zitrusfrüchte",
  },
  {
    id: "6",
    name: "Blaufränkisch Ried Mariental",
    producer: "Ernst Triebaumer",
    vintage: 2017,
    region: "Burgenland",
    country: "Österreich",
    type: "rot",
    grape: "Blaufränkisch",
    quantity: 5,
    purchasePrice: 55,
    purchaseDate: "2020-07-22",
    purchaseLocation: "Ab Hof",
    drinkFrom: 2022,
    drinkUntil: 2035,
    rating: 95,
    personalRating: 5,
    notes: "Dunkelfruchtig, Brombeere, feine Tannine, lang",
  },
];

export interface WishlistItem {
  id: string;
  name: string;
  imageData?: string; // base64-encoded bottle image
  location: string; // Ort
  occasion: string; // Trinkgelegenheit
  companions: string; // Mit wem getrunken
  notes?: string;
  createdAt: string;
}

export function getWineTypeColor(type: Wine["type"]) {
  switch (type) {
    case "rot": return "bg-wine-burgundy/20 text-wine-rose border-wine-burgundy/30";
    case "weiss": return "bg-wine-gold/15 text-wine-gold border-wine-gold/30";
    case "rosé": return "bg-wine-rose/15 text-wine-rose border-wine-rose/30";
    case "schaumwein": return "bg-accent/15 text-accent border-accent/30";
    case "dessert": return "bg-wine-gold/20 text-wine-gold-light border-wine-gold/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export function getWineTypeLabel(type: Wine["type"]) {
  switch (type) {
    case "rot": return "Rotwein";
    case "weiss": return "Weisswein";
    case "rosé": return "Rosé";
    case "schaumwein": return "Schaumwein";
    case "dessert": return "Dessertwein";
  }
}

export function getDrinkStatus(wine: Wine): { label: string; color: string } {
  const year = new Date().getFullYear();
  if (year < wine.drinkFrom) return { label: "Noch lagern", color: "text-wine-gold" };
  if (year >= wine.drinkFrom && year <= wine.drinkUntil) return { label: "Trinkreif", color: "text-green-400" };
  return { label: "Überschritten", color: "text-destructive" };
}
