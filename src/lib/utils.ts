import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getStoredCurrency(): string {
  if (typeof window === "undefined") return "CHF";

  try {
    const env = window.localStorage.getItem("vinvault_env") === "test" ? "test" : "prod";
    const raw = window.localStorage.getItem(`vinvault_${env}_settings`);
    if (!raw) return "CHF";

    const parsed = JSON.parse(raw) as { currency?: unknown };
    if (typeof parsed.currency !== "string") return "CHF";

    const normalized = parsed.currency.trim().toUpperCase();
    return /^[A-Z]{3}$/.test(normalized) ? normalized : "CHF";
  } catch {
    return "CHF";
  }
}

export function formatCurrency(value?: number, currency = getStoredCurrency()): string {
  if (value === undefined || value === null) return "–";
  const normalizedCurrency = /^[A-Z]{3}$/.test(currency.trim().toUpperCase())
    ? currency.trim().toUpperCase()
    : getStoredCurrency();
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: normalizedCurrency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
