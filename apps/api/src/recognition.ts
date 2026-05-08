import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type RecognizedBottle = {
  name?: string;
  producer?: string;
  vintage?: number;
  region?: string;
  country?: string;
  type?: "rot" | "weiss" | "rose" | "schaumwein" | "dessert";
  confidence?: number;
  bbox?: { x: number; y: number; w: number; h: number };
};

const PROMPT = `Du analysierst ein Foto eines Weinregals.
Identifiziere alle Flaschen, deren Etikett du lesen kannst.
Antworte ausschliesslich als JSON-Array. Jedes Objekt hat diese optionalen Felder:
{"name":string,"producer":string,"vintage":number,"region":string,"country":string,"type":"rot|weiss|rose|schaumwein|dessert","confidence":0.0-1.0,"bbox":{"x":0-1,"y":0-1,"w":0-1,"h":0-1}}
Lasse Felder weg, die du nicht sicher erkennst. Nur JSON, keine Erklaerungen.`;

const RECOGNITION_MODEL = process.env.RECOGNITION_MODEL ?? "claude-sonnet-4-6";
const RECOGNITION_TIMEOUT_MS = 60_000;

export async function recognizeBottles(imageUrl: string): Promise<{
  bottles: RecognizedBottle[];
  inputTokens: number;
  outputTokens: number;
}> {
  const signal = AbortSignal.timeout(RECOGNITION_TIMEOUT_MS);
  const response = await client.messages.create(
    {
      model: RECOGNITION_MODEL,
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: PROMPT },
        ],
      }],
    },
    { signal },
  );

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  let bottles: RecognizedBottle[] = [];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) bottles = JSON.parse(match[0]) as RecognizedBottle[];
  } catch {
    bottles = [];
  }

  return {
    bottles,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

export function estimateCostCents(input: number, output: number): number {
  return Math.round((input / 1_000_000) * 300 + (output / 1_000_000) * 1500);
}
