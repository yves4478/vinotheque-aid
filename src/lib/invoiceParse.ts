import type { Wine } from "@/data/wines";

export interface ParsedPosition {
  id: string;
  name: string;
  producer: string;
  vintage: number | null;
  quantity: number;
  purchasePrice: number | null;
  region: string;
  country: string;
  type: Wine["type"] | null;
  grape: string;
  selected: boolean;
}

// ── PDF text extraction ───────────────────────────────────────────────────────

export async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  // Use the bundled worker via Vite's URL helper
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n");
}

// ── Claude API parsing ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du bist ein Experte für das Auslesen von Weinlieferanten-Rechnungen und Lieferscheinen aus der Schweiz und Deutschland.

Extrahiere alle Weinpositionen aus dem Text und gib ausschliesslich ein JSON-Array zurück — kein anderer Text, keine Erklärungen, kein Markdown.

Jedes Objekt im Array:
{
  "name": "Weinname (z.B. Château Margaux, Barolo, Riesling Spätlese)",
  "producer": "Produzent / Weingut (z.B. Domaine Leflaive)",
  "vintage": 2021,
  "quantity": 6,
  "purchasePrice": 18.50,
  "region": "Region (z.B. Bordeaux, Piemont, Mosel)",
  "country": "Land (z.B. Frankreich, Italien, Schweiz)",
  "type": "rot" | "weiss" | "rosé" | "schaumwein" | "dessert",
  "grape": "Rebsorte(n) (z.B. Cabernet Sauvignon, Riesling)"
}

Regeln:
- purchasePrice ist der Preis pro Flasche in CHF (nicht der Gesamtpreis der Position).
- Wenn Gesamtpreis und Menge bekannt: purchasePrice = Gesamtpreis / Menge.
- Fehlende Werte: null (nicht 0, nicht "").
- vintage: nur vierstellige Jahreszahl oder null.
- quantity: Anzahl Flaschen (Standardflasche 75cl). Grossflaschen entsprechend umrechnen.
- type: ableiten aus Farbe, Rebsorte oder Weinname. null wenn unklar.
- Nur echte Weinpositionen — keine Versandkosten, Rabatte, Leergut o.ä.`;

export async function parseInvoiceWithClaude(
  text: string,
  apiKey: string,
): Promise<ParsedPosition[]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Rechnungstext:\n\n${text.slice(0, 30000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Claude API Fehler ${response.status}`);
  }

  const result = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };
  const raw = result.content.find((b) => b.type === "text")?.text ?? "[]";

  const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] ?? "[]";
  const items = JSON.parse(jsonStr) as Array<Record<string, unknown>>;

  return items.map((item, i) => ({
    id: `parsed-${i}-${Date.now()}`,
    name: String(item.name ?? ""),
    producer: String(item.producer ?? ""),
    vintage: typeof item.vintage === "number" ? item.vintage : null,
    quantity: typeof item.quantity === "number" ? Math.max(1, item.quantity) : 1,
    purchasePrice: typeof item.purchasePrice === "number" ? item.purchasePrice : null,
    region: String(item.region ?? ""),
    country: String(item.country ?? ""),
    type: isWineType(item.type) ? item.type : null,
    grape: String(item.grape ?? ""),
    selected: true,
  }));
}

function isWineType(v: unknown): v is Wine["type"] {
  return ["rot", "weiss", "rosé", "schaumwein", "dessert"].includes(v as string);
}
