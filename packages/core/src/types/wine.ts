// Core domain types — no browser or React Native dependencies here

export type WineType = "rot" | "weiss" | "rosé" | "schaumwein" | "dessert";

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
  type: WineType;
  grape: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  purchaseLocation: string;
  storageLocation?: string;
  drinkFrom: number;
  drinkUntil: number;
  rating?: number;
  personalRating?: number;
  notes?: string;
  imageUri?: string;   // mobile: local file URI  (replaces imageUrl/imageData from web)
  imageUrl?: string;
  imageData?: string;
  images?: WineImage[];
  purchaseLink?: string;
  isGift?: boolean;
  giftFrom?: string;
  isRarity?: boolean;
  bottleSize?: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  producer?: string;
  vintage?: number;
  type?: WineType;
  region?: string;
  country?: string;
  grape?: string;
  rating?: number;
  tastedDate?: string;
  tastedLocation?: string;
  price?: number;
  imageUri?: string;
  imageData?: string;
  images?: WineImage[];
  tastingEvent?: string;
  tastingSupplier?: string;
  tastingStand?: string;
  location: string;
  occasion: string;
  companions: string;
  notes?: string;
  createdAt: string;
  source?: "manual" | "add-wine" | "vivino" | "tasting";
  sourceUrl?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  producer: string;
  quantity: number;
  estimatedPrice: number;
  reason: string;
  checked: boolean;
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
  type: WineType;
  consumedDate: string;
}

export interface AppSettings {
  cellarName: string;
}

export const DEFAULT_SETTINGS: AppSettings = { cellarName: "Mein Weinkeller" };

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

export type BottleSizeValue = (typeof BOTTLE_SIZES)[number]["value"];
