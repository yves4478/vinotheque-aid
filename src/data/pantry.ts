export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  expiryDate: string;
  purchasePrice: number;
  notes?: string;
}

export const defaultCategories = [
  "Konserven",
  "Getränke",
  "Gewürze",
  "Tiefkühlware",
  "Putzmittel",
  "Hygiene",
  "Batterien & Technik",
  "Backwaren",
  "Öle & Essig",
  "Sonstiges",
];

export const defaultUnits = [
  "Stück",
  "kg",
  "g",
  "Liter",
  "ml",
  "Packung",
  "Dose",
  "Flasche",
  "Tube",
  "Rolle",
];

export const defaultLocations = [
  "Küche",
  "Keller",
  "Vorratsschrank",
  "Kühlschrank",
  "Tiefkühler",
  "Garage",
  "Badezimmer",
  "Abstellraum",
];

export function getExpiryStatus(item: PantryItem): { label: string; color: string } {
  if (!item.expiryDate) return { label: "Kein Datum", color: "text-muted-foreground" };
  const today = new Date();
  const expiry = new Date(item.expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: "Abgelaufen", color: "text-destructive" };
  if (diffDays <= 7) return { label: `${diffDays} Tage`, color: "text-orange-400" };
  if (diffDays <= 30) return { label: `${diffDays} Tage`, color: "text-yellow-400" };
  return { label: "OK", color: "text-green-400" };
}
