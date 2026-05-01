import {
  MIN_RECOGNIZED_VINTAGE_YEAR,
  type RecognizedWineDraft,
} from "@vinotheque/core";

const SYSTEM_PROMPT = `Du bist ein Experte fuer Weinetiketten. Lies das Bild und extrahiere die Weinfelder.

Gib ausschliesslich dieses JSON-Objekt zurueck — kein Markdown, kein anderer Text:
{"producer":"...","name":"...","vintage":2021,"region":"...","country":"...","type":"rot","grape":"..."}

Regeln:
- vintage: vierstellige Jahreszahl oder null.
- type: "rot" | "weiss" | "rosé" | "schaumwein" | "dessert" | null.
- Fehlende oder unsichere Werte: null.
- Erfinde keine Werte.`;

const VALID_TYPES = ["rot", "weiss", "rosé", "schaumwein", "dessert"];

function extractClaudeVisionJson(raw: string): Record<string, unknown> {
  const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}";

  try {
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    throw new Error(
      "Claude Vision lieferte kein gueltiges JSON. Bitte den Scan erneut versuchen oder die Felder manuell pruefen.",
    );
  }
}

export async function scanWithClaudeVision(
  imageBase64: string,
  apiKey: string,
  mediaType = "image/jpeg",
): Promise<RecognizedWineDraft> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Claude API Fehler ${response.status}`);
  }

  const result = await response.json() as { content: Array<{ type: string; text: string }> };
  const raw = result.content.find((b) => b.type === "text")?.text ?? "{}";
  const data = extractClaudeVisionJson(raw);

  const currentYear = new Date().getFullYear();
  const fields: RecognizedWineDraft["fields"] = {};

  if (typeof data.producer === "string" && data.producer) {
    fields.producer = { value: data.producer, confidence: "high" };
  }
  if (typeof data.name === "string" && data.name) {
    fields.name = { value: data.name, confidence: "high" };
  }
  if (
    typeof data.vintage === "number" &&
    data.vintage >= MIN_RECOGNIZED_VINTAGE_YEAR &&
    data.vintage <= currentYear
  ) {
    fields.vintage = { value: data.vintage, confidence: "high" };
  }
  if (typeof data.region === "string" && data.region) {
    fields.region = { value: data.region, confidence: "medium" };
  }
  if (typeof data.country === "string" && data.country) {
    fields.country = { value: data.country, confidence: "medium" };
  }
  if (typeof data.grape === "string" && data.grape) {
    fields.grape = { value: data.grape, confidence: "medium" };
  }
  if (typeof data.type === "string" && VALID_TYPES.includes(data.type)) {
    fields.type = {
      value: data.type as RecognizedWineDraft["fields"]["type"]!["value"],
      confidence: "medium",
    };
  }

  return { rawText: "", fields, warnings: [] };
}
