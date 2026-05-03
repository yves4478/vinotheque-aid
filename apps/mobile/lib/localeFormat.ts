const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function normalizeCurrencyCode(currency?: string): string {
  const normalized = currency?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "CHF";
}

function parseIsoDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function toDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const isoDate = parseIsoDate(value);
  if (isoDate) return isoDate;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toIsoDate(value: string | Date): string {
  const date = toDate(value) ?? new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateForLocale(value?: string | Date): string {
  if (!value) return "-";
  const date = toDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat(undefined, DATE_FORMAT_OPTIONS).format(date);
}

export function getDatePlaceholder(): string {
  const sample = new Date(2006, 10, 22);
  return new Intl.DateTimeFormat(undefined, DATE_FORMAT_OPTIONS)
    .formatToParts(sample)
    .map((part) => {
      if (part.type === "day") return "DD";
      if (part.type === "month") return "MM";
      if (part.type === "year") return "YYYY";
      return part.value;
    })
    .join("");
}

export function parseDateInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoDate = parseIsoDate(trimmed);
  if (isoDate) return toIsoDate(isoDate);

  const numbers = trimmed.match(/\d+/g);
  if (!numbers || numbers.length < 3) return null;

  const sample = new Date(2006, 10, 22);
  const order = new Intl.DateTimeFormat(undefined, DATE_FORMAT_OPTIONS)
    .formatToParts(sample)
    .filter((part) => part.type === "day" || part.type === "month" || part.type === "year")
    .map((part) => part.type);

  const values: Record<string, number> = {};
  order.forEach((part, index) => {
    const raw = numbers[index];
    if (!raw) return;
    let numeric = Number(raw);
    if (part === "year" && raw.length === 2) {
      numeric += numeric >= 70 ? 1900 : 2000;
    }
    values[part] = numeric;
  });

  const year = values.year;
  const month = values.month;
  const day = values.day;

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return toIsoDate(date);
}

export function normalizeDateInput(value: string): string {
  const isoDate = parseDateInput(value);
  return isoDate ? formatDateForLocale(isoDate) : value.trim();
}

export function parseLocaleNumber(value: string): number {
  const decimalFromLocale = new Intl.NumberFormat(undefined)
    .formatToParts(12345.6)
    .find((part) => part.type === "decimal")?.value ?? ".";
  const decimalCandidates = unique([decimalFromLocale, ".", ","]);
  const text = value.trim();
  const decimalIndex = Math.max(...decimalCandidates.map((separator) => text.lastIndexOf(separator)));
  let normalized = "";

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (/\d/.test(char)) {
      normalized += char;
      continue;
    }
    if ((char === "-" || char === "+") && normalized.length === 0) {
      normalized += char;
      continue;
    }
    if (index === decimalIndex && decimalCandidates.includes(char)) {
      normalized += ".";
    }
  }

  return Number.parseFloat(normalized) || 0;
}

export function formatCurrencyForLocale(value?: number, currency = "CHF"): string {
  if (value === undefined || value === null) return "-";
  const normalizedCurrency = normalizeCurrencyCode(currency);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: normalizedCurrency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getCurrencyPlaceholder(currency = "CHF"): string {
  return formatCurrencyForLocale(0, currency).replace(/\d/g, "0");
}

export function formatIntegerForLocale(value?: number): string {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}
