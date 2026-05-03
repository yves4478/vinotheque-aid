function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function normalizeCurrencyCode(currency?: string): string {
  const normalized = currency?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "CHF";
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
  if (value === undefined || value === null) return "–";
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

export function normalizeCurrencyInput(value: string, currency = "CHF"): string {
  if (!value.trim()) return "";
  return formatCurrencyForLocale(parseLocaleNumber(value), currency);
}
