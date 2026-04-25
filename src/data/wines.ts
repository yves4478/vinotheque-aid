export interface WineImage {
  id: string;
  uri: string;
  label?: "Flasche" | "Etikett" | "Ruecketikett" | "Liste" | "Stand" | "Notiz";
  isPrimary?: boolean;
  createdAt?: string;
}

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
  imageData?: string;
  imageUri?: string;
  images?: WineImage[];
  purchaseLink?: string;
  isGift?: boolean;
  giftFrom?: string;
  isRarity?: boolean;
  bottleSize?: string;
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
  // Wine details (filled when added via "Nur Erfassen")
  producer?: string;
  vintage?: number;
  type?: Wine["type"];
  region?: string;
  country?: string;
  grape?: string;
  rating?: number;
  tastedDate?: string;
  tastedLocation?: string;
  price?: number;
  // Experience details (filled manually in Merkliste)
  imageData?: string;
  imageUri?: string;
  images?: WineImage[];
  tastingEvent?: string;
  tastingSupplier?: string;
  tastingStand?: string;
  location: string;
  occasion: string;
  companions: string;
  notes?: string;
  createdAt: string;
  source?: "manual" | "add-wine" | "vivino" | "tasting"; // how was this entry created
  sourceUrl?: string;
}

export const BOTTLE_SIZES = [
  { value: "standard", label: "Standard (0.75L)" },
  { value: "magnum", label: "Magnum (1.5L)" },
  { value: "jeroboam", label: "Jeroboam (3L)" },
  { value: "rehoboam", label: "Rehoboam (4.5L)" },
  { value: "methusalem", label: "Methusalem (6L)" },
  { value: "salmanazar", label: "Salmanazar (9L)" },
  { value: "balthazar", label: "Balthazar (12L)" },
  { value: "nebukadnezar", label: "Nebukadnezar (15L)" },
] as const;

export function getBottleSizeLabel(size?: string): string {
  const found = BOTTLE_SIZES.find((b) => b.value === size);
  return found ? found.label : "Standard (0.75L)";
}

export function isLargeFormat(size?: string): boolean {
  return !!size && size !== "standard";
}

export function getWineTypeColor(type: Wine["type"]) {
  switch (type) {
    case "rot":      return "bg-red-50 text-red-700";
    case "weiss":    return "bg-amber-50 text-amber-700";
    case "rosé":     return "bg-pink-50 text-pink-600";
    case "schaumwein": return "bg-sky-50 text-sky-600";
    case "dessert":  return "bg-yellow-50 text-yellow-700";
    default:         return "bg-gray-50 text-gray-500";
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

export function createWineImage(uri: string, label?: WineImage["label"], isPrimary = false): WineImage {
  return {
    id: `image-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    uri,
    label,
    isPrimary,
    createdAt: new Date().toISOString(),
  };
}

export function getWineImages(item: Pick<Wine, "images" | "imageData" | "imageUri" | "imageUrl"> | Pick<WishlistItem, "images" | "imageData" | "imageUri">): WineImage[] {
  const explicit = item.images?.filter((image) => image.uri).slice(0, 3) ?? [];
  if (explicit.length > 0) return explicit;

  const legacyUri = "imageData" in item && item.imageData
    ? item.imageData
    : "imageUri" in item && item.imageUri
      ? item.imageUri
      : "imageUrl" in item
        ? item.imageUrl
        : undefined;

  return legacyUri
    ? [{ id: "legacy-image", uri: legacyUri, label: "Flasche", isPrimary: true }]
    : [];
}

export function getPrimaryWineImage(item: Pick<Wine, "images" | "imageData" | "imageUri" | "imageUrl"> | Pick<WishlistItem, "images" | "imageData" | "imageUri">): WineImage | undefined {
  const images = getWineImages(item);
  return images.find((image) => image.isPrimary) ?? images[0];
}

export interface MerchantDeal {
  id: string;
  wineName: string;
  producer: string;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  validFrom: string;
  validUntil: string;
  notes?: string;
}

export interface Merchant {
  id: string;
  name: string;
  website?: string;
  location?: string;
  notes?: string;
  deals: MerchantDeal[];
  createdAt: string;
}

export interface ConsumedWine {
  id: string;
  wineId: string;
  name: string;
  producer: string;
  vintage: number;
  type: Wine["type"];
  consumedDate: string; // ISO date
}

export function getDrinkStatus(wine: Wine): { label: string; color: string } {
  const year = new Date().getFullYear();
  if (year < wine.drinkFrom) return { label: "Noch lagern", color: "text-amber-600" };
  if (year >= wine.drinkFrom && year <= wine.drinkUntil) return { label: "Trinkreif", color: "text-green-600" };
  return { label: "Überschritten", color: "text-red-600" };
}
