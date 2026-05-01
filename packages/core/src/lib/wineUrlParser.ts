import { wineRegions } from "../data/wineRegions";
import type { Wine } from "../types/wine";

export type ImportedWineData = Partial<Pick<Wine,
  "name" | "producer" | "vintage" | "region" | "country" | "type" | "grape" |
  "purchasePrice" | "notes" | "rating"
>>;

const REGION_TERMS: string[] = Array.from(
  new Set(
    wineRegions.flatMap((region) => [region.name, ...(region.aliases || [])]),
  ),
).sort((a, b) => b.length - a.length);

const REGION_COUNTRY_LOOKUP = new Map(
  wineRegions.flatMap((region) => [
    [region.name.toLowerCase(), region.country],
    ...((region.aliases || []).map((alias) => [alias.toLowerCase(), region.country] as const)),
  ]),
);

export function inferWineDetailsFromText(text: string): ImportedWineData {
  const data: ImportedWineData = {};
  extractWineDetailsFromText(text, data);

  if (!data.country && data.region) {
    data.country = REGION_COUNTRY_LOOKUP.get(data.region.toLowerCase());
  }

  if (!data.type) {
    const allText = [text, data.grape].filter(Boolean).join(" ").toLowerCase();
    data.type = detectWineType(allText);
  }

  return data;
}

export async function fetchWineDataFromUrl(url: string): Promise<ImportedWineData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Die Webseite konnte nicht geladen werden.");
  }
  const html = await response.text();

  const data: ImportedWineData = {};

  // Try JSON-LD structured data first (most reliable)
  const jsonLdData = extractJsonLd(html);
  if (jsonLdData) Object.assign(data, jsonLdData);

  // Enrich with Open Graph / meta tags
  const metaData = extractMetaTags(html);
  mergeIfEmpty(data, metaData);

  // Enrich with page content heuristics
  const pageData = extractFromPageContent(html);
  mergeIfEmpty(data, pageData);

  // Post-process: try to extract vintage from name
  if (!data.vintage && data.name) {
    const yearMatch = data.name.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      data.vintage = parseInt(yearMatch[0]);
      data.name = data.name.replace(yearMatch[0], "").replace(/\s{2,}/g, " ").trim();
    }
  }

  // Post-process: detect wine type from text clues
  if (!data.type) {
    const allText = [data.name, data.grape, data.notes].filter(Boolean).join(" ").toLowerCase();
    data.type = detectWineType(allText);
  }

  return data;
}

function extractJsonLd(html: string): ImportedWineData | null {
  const scripts = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(decodeHtmlEntities(script[1] || ""));
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const product = findProductInJsonLd(item);
        if (product) return mapJsonLdProduct(product);
      }
    } catch { /* ignore malformed JSON-LD */ }
  }
  return null;
}

function findProductInJsonLd(obj: unknown): Record<string, unknown> | null {
  if (!obj || typeof obj !== "object") return null;
  const record = obj as Record<string, unknown>;
  const type = String(record["@type"] || "").toLowerCase();
  if (type === "product" || type === "wine") return record;
  if (record["@graph"] && Array.isArray(record["@graph"])) {
    for (const item of record["@graph"]) {
      const found = findProductInJsonLd(item);
      if (found) return found;
    }
  }
  return null;
}

function mapJsonLdProduct(product: Record<string, unknown>): ImportedWineData {
  const data: ImportedWineData = {};

  if (typeof product.name === "string") data.name = cleanText(product.name);

  const brand = product.brand as Record<string, unknown> | undefined;
  if (brand && typeof brand.name === "string") {
    data.producer = cleanText(brand.name);
  } else if (typeof product.brand === "string") {
    data.producer = cleanText(product.brand);
  } else if (typeof product.manufacturer === "string") {
    data.producer = cleanText(product.manufacturer);
  }

  if (typeof product.description === "string") {
    data.notes = cleanText(product.description).substring(0, 500);
  }

  const aggregateRating = product.aggregateRating as Record<string, unknown> | undefined;
  if (aggregateRating) {
    const ratingValue = parseLooseNumber(aggregateRating.ratingValue);
    if (ratingValue !== undefined && ratingValue >= 0 && ratingValue <= 5) {
      data.rating = ratingValue;
    }
  }

  // Price
  const offers = product.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
  const offer = Array.isArray(offers) ? offers[0] : offers;
  if (offer && (typeof offer.price === "string" || typeof offer.price === "number")) {
    data.purchasePrice = parseFloat(String(offer.price)) || undefined;
  }

  // Additional properties (wine-specific JSON-LD or custom fields)
  if (typeof product.countryOfOrigin === "string") data.country = cleanText(product.countryOfOrigin);
  const origin = product.countryOfOrigin as Record<string, unknown> | undefined;
  if (origin && typeof origin.name === "string") data.country = cleanText(origin.name);

  return data;
}

function extractMetaTags(html: string): ImportedWineData {
  const data: ImportedWineData = {};

  const ogTitle = getMeta(html, "property", "og:title");
  if (ogTitle) data.name = cleanText(ogTitle);

  const ogDescription = getMeta(html, "property", "og:description") || getMeta(html, "name", "description");
  if (ogDescription && !data.notes) data.notes = cleanText(ogDescription).substring(0, 500);

  const ogPrice = getMeta(html, "property", "product:price:amount") || getMeta(html, "property", "og:price:amount");
  if (ogPrice) data.purchasePrice = parseFloat(ogPrice) || undefined;

  const ogBrand = getMeta(html, "property", "product:brand") || getMeta(html, "property", "og:brand");
  if (ogBrand) data.producer = cleanText(ogBrand);

  const rawRating =
    getMeta(html, "property", "product:rating:value") ||
    getMeta(html, "property", "product:rating:average") ||
    getMeta(html, "name", "rating");
  const parsedRating = parseLooseNumber(rawRating);
  if (parsedRating !== undefined && parsedRating >= 0 && parsedRating <= 5) {
    data.rating = parsedRating;
  }

  return data;
}

function getMeta(html: string, attr: string, value: string): string | null {
  const tags = html.matchAll(/<meta\b[^>]*>/gi);
  for (const tag of tags) {
    const source = tag[0];
    if (getAttribute(source, attr)?.toLowerCase() === value.toLowerCase()) {
      const content = getAttribute(source, "content");
      return content ? decodeHtmlEntities(content) : null;
    }
  }
  return null;
}

function extractFromPageContent(html: string): ImportedWineData {
  const data: ImportedWineData = {};

  // Try common selectors for product pages
  const title = extractFirstElementText(html, "h1") || extractTextByClassFragment(html, [
    "product-name",
    "product_name",
    "productName",
  ]);
  if (title && title.length < 200) data.name = cleanText(title);

  // Look for price patterns in the page
  if (!data.purchasePrice) {
    const priceText = extractTextByClassFragment(html, ["price", "product-price"]) || extractTextByAttribute(html, "itemprop", "price");
    if (priceText) {
      const priceMatch = priceText.match(/[\d]+[.,][\d]{2}/);
      if (priceMatch) {
        data.purchasePrice = parseFloat(priceMatch[0].replace(",", ".")) || undefined;
      }
    }
  }

  // Extract wine details from description/body text
  const body = htmlToText(html);
  extractWineDetailsFromText(body, data);

  if (!data.rating) {
    data.rating = extractRatingFromText(body);
  }

  return data;
}

function extractWineDetailsFromText(text: string, data: ImportedWineData) {
  const lower = text.toLowerCase();

  // Region patterns (common wine regions)
  if (!data.region) {
    for (const region of REGION_TERMS) {
      if (lower.includes(region.toLowerCase())) {
        data.region = region;
        break;
      }
    }
  }

  // Country patterns
  if (!data.country) {
    const countries: Record<string, string[]> = {
      "Italien": ["italien", "italy", "italia", "italiano"],
      "Frankreich": ["frankreich", "france", "français"],
      "Spanien": ["spanien", "spain", "españa"],
      "Österreich": ["österreich", "austria"],
      "Deutschland": ["deutschland", "germany"],
      "Schweiz": ["schweiz", "switzerland", "suisse", "svizzera"],
      "Portugal": ["portugal"],
      "Australien": ["australien", "australia"],
      "USA": ["usa", "united states", "kalifornien", "california", "oregon"],
      "Argentinien": ["argentinien", "argentina"],
      "Chile": ["chile"],
      "Südafrika": ["südafrika", "south africa"],
      "Neuseeland": ["neuseeland", "new zealand"],
    };
    for (const [country, keywords] of Object.entries(countries)) {
      if (keywords.some(k => lower.includes(k))) {
        data.country = country;
        break;
      }
    }
  }

  // Grape variety patterns
  if (!data.grape) {
    const grapes = [
      "Nebbiolo", "Sangiovese", "Barbera", "Primitivo", "Corvina", "Nero d'Avola",
      "Cabernet Sauvignon", "Merlot", "Pinot Noir", "Syrah", "Shiraz", "Grenache",
      "Tempranillo", "Garnacha", "Monastrell", "Mencía",
      "Blaufränkisch", "Zweigelt", "St. Laurent",
      "Spätburgunder", "Dornfelder", "Lemberger", "Trollinger",
      "Malbec", "Carménère", "Pinotage", "Tannat",
      "Chardonnay", "Sauvignon Blanc", "Riesling", "Pinot Grigio", "Pinot Gris",
      "Gewürztraminer", "Grüner Veltliner", "Muscat", "Viognier",
      "Chenin Blanc", "Sémillon", "Marsanne", "Roussanne",
      "Albariño", "Verdejo", "Godello", "Grillo", "Vermentino",
      "Müller-Thurgau", "Silvaner", "Weissburgunder",
      "Chasselas", "Petite Arvine", "Completer", "Cornalin",
      "Gamay", "Carignan", "Mourvèdre", "Cinsault",
      "Cabernet Franc", "Petit Verdot", "Zinfandel",
    ];
    for (const grape of grapes) {
      if (lower.includes(grape.toLowerCase())) {
        data.grape = grape;
        break;
      }
    }
  }

  // Vintage from text (look for 4-digit years)
  if (!data.vintage) {
    const yearMatch = text.match(/(?:Jahrgang|Vintage|Millésime|Annata|Jahr|Ernte)[:\s]*(\d{4})/i);
    if (yearMatch) {
      const y = parseInt(yearMatch[1]);
      if (y >= 1900 && y <= new Date().getFullYear()) data.vintage = y;
    }
  }
}

export function detectWineType(text: string): Wine["type"] | undefined {
  const lower = text.toLowerCase();
  if (/\b(schaumwein|champagne|prosecco|cava|crémant|spumante|sekt|brut|franciacorta|perlwein)\b/.test(lower)) return "schaumwein";
  if (/\b(rosé|rosato|rosado)\b/.test(lower)) return "rosé";
  if (/\b(dessertwein|süsswein|sauternes|auslese|beerenauslese|trockenbeerenauslese|eiswein|tokaji|moscato\s*d'asti|vin\s*doux|passito|recioto)\b/.test(lower)) return "dessert";
  if (/\b(weisswein|white\s*wine|vin\s*blanc|vino\s*bianco|chardonnay|sauvignon\s*blanc|riesling|pinot\s*grigio|grüner\s*veltliner|gewürztraminer|chenin\s*blanc|viognier|albariño|verdejo|müller.thurgau|silvaner|weissburgunder|chasselas)\b/.test(lower)) return "weiss";
  if (/\b(rotwein|red\s*wine|vin\s*rouge|vino\s*rosso|cabernet|merlot|pinot\s*noir|syrah|shiraz|nebbiolo|sangiovese|tempranillo|malbec|grenache|blaufränkisch|zweigelt|spätburgunder|primitivo|zinfandel)\b/.test(lower)) return "rot";
  return undefined;
}

function cleanText(text: string): string {
  return decodeHtmlEntities(text).replace(/\s+/g, " ").trim();
}

function getAttribute(source: string, attr: string): string | null {
  const pattern = new RegExp(`\\s${escapeRegExp(attr)}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = source.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function extractFirstElementText(html: string, tagName: string): string | null {
  const pattern = new RegExp(`<${escapeRegExp(tagName)}\\b[^>]*>([\\s\\S]*?)<\\/${escapeRegExp(tagName)}>`, "i");
  const match = html.match(pattern);
  return match ? htmlToText(match[1]) : null;
}

function extractTextByClassFragment(html: string, classFragments: string[]): string | null {
  const tags = html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>([\s\S]*?)<\/\1>/gi);
  for (const tag of tags) {
    const classes = getAttribute(tag[2], "class") || "";
    const hasMatch = classFragments.some((fragment) => classes.toLowerCase().includes(fragment.toLowerCase()));
    const isOldPrice = /\b(old|crossed)\b/i.test(classes);
    if (hasMatch && !isOldPrice) {
      const text = htmlToText(tag[3]);
      if (text) return text;
    }
  }
  return null;
}

function extractTextByAttribute(html: string, attr: string, value: string): string | null {
  const tags = html.matchAll(/<([a-z][\w:-]*)\b([^>]*)>([\s\S]*?)<\/\1>/gi);
  for (const tag of tags) {
    if (getAttribute(tag[2], attr)?.toLowerCase() === value.toLowerCase()) {
      const text = htmlToText(tag[3]);
      if (text) return text;
    }
  }
  return null;
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) => String.fromCharCode(Number.parseInt(code, 16)));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractRatingFromText(text: string): number | undefined {
  const normalized = text.replace(/\s+/g, " ");
  const match = normalized.match(/\b([0-5][.,]\d)\s*(?:\((?:[\d.,]+)\)|[\d.,]+\s+total ratings)\b/i);
  const rating = parseLooseNumber(match?.[1]);
  if (rating !== undefined && rating >= 0 && rating <= 5) {
    return rating;
  }
  return undefined;
}

function parseLooseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const compact = trimmed.replace(/\s/g, "");
  const normalized = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(compact)
    ? compact.replace(/,/g, "")
    : compact.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mergeIfEmpty(target: ImportedWineData, source: ImportedWineData) {
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== null && value !== "" && !(key in target && target[key as keyof ImportedWineData])) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
}
