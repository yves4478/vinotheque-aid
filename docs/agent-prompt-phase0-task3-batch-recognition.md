# Codex Prompt — Phase 0 / Task 3: Backend Batch-Erkennung mit Claude Vision

## Auftrag

Baue den Backend-Teil der Capture Sessions: Foto-Empfang, Speicherung in MinIO, Erkennung aller Weinflaschen pro Foto via Claude Vision API, Speicherung der Kandidaten.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Arbeitsverzeichnis:** `apps/api/`

---

## Was bereits existiert (Voraussetzung: Task 0.1 muss fertig sein)

- `apps/api/src/storage.ts` — `uploadImage()`, `deleteImage()`
- `apps/api/prisma/schema.prisma` — Modelle `CaptureSession`, `CapturePhoto`, `RecognizedCandidate` sind vorhanden
- `apps/api/src/db.ts` — Prisma Client
- `apps/api/src/index.ts` — Hono-App, Routen-Registrierung hier nachtragen

**ENV-Variablen (ergaenzt in Task 0.1, hier Anthropic hinzufuegen):**

In `apps/api/.env.example` ergaenzen:
```
ANTHROPIC_API_KEY=
```

---

## Was du baust

### Schritt 1 — Anthropic SDK installieren

```bash
cd apps/api
npm install @anthropic-ai/sdk
```

### Schritt 2 — Vision-Modul anlegen

Neue Datei `apps/api/src/recognition.ts`:

```typescript
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

const PROMPT = `Du analysierst ein Foto eines Weinregals oder einer Weinsammlung.
Identifiziere alle Flaschen, deren Etikett du lesen kannst.
Antworte ausschliesslich als JSON-Array. Jedes Objekt hat diese optionalen Felder:
{ "name": string, "producer": string, "vintage": number, "region": string, "country": string, "type": "rot|weiss|rose|schaumwein|dessert", "confidence": 0.0-1.0, "bbox": {"x":0-1,"y":0-1,"w":0-1,"h":0-1} }
Lasse Felder weg, die du nicht sicher erkennst. Keine Erklaerungen, nur JSON-Array.`;

export async function recognizeBottles(
  imageUrl: string,
): Promise<{ bottles: RecognizedBottle[]; inputTokens: number; outputTokens: number }> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let bottles: RecognizedBottle[] = [];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) bottles = JSON.parse(match[0]) as RecognizedBottle[];
  } catch {
    // Kein gueltiges JSON — leeres Array zurueckgeben
  }

  return {
    bottles,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// Kosten in Cent: claude-sonnet-4-6 Preise (April 2026)
// Input: $3/MTok, Output: $15/MTok — in Cent umgerechnet
export function estimateCostCents(inputTokens: number, outputTokens: number): number {
  return Math.round((inputTokens / 1_000_000) * 300 + (outputTokens / 1_000_000) * 1500);
}
```

### Schritt 3 — Capture Sessions Router anlegen

Neue Datei `apps/api/src/routes/captureSessions.ts`:

```typescript
import { Hono } from "hono";
import prisma from "../db";
import { uploadImage, deleteImage } from "../storage";
import { recognizeBottles, estimateCostCents } from "../recognition";

export const captureSessionsRouter = new Hono();

// ── Session anlegen ──────────────────────────────────────────────────────────

captureSessionsRouter.post("/", async (c) => {
  const session = await prisma.captureSession.create({ data: {} });
  return c.json(session, 201);
});

// ── Session-Liste ─────────────────────────────────────────────────────────────

captureSessionsRouter.get("/", async (c) => {
  const sessions = await prisma.captureSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true, candidates: true } } },
  });
  return c.json(sessions);
});

// ── Session-Detail ────────────────────────────────────────────────────────────

captureSessionsRouter.get("/:id", async (c) => {
  const session = await prisma.captureSession.findUnique({
    where: { id: c.req.param("id") },
    include: {
      photos: true,
      candidates: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!session) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json(session);
});

// ── Foto hochladen ────────────────────────────────────────────────────────────

captureSessionsRouter.post("/:id/photos", async (c) => {
  const sessionId = c.req.param("id");
  const session = await prisma.captureSession.findUnique({ where: { id: sessionId } });
  if (!session) return c.json({ error: "Session nicht gefunden." }, 404);
  if (session.status !== "open") return c.json({ error: "Session ist nicht offen." }, 409);

  const formData = await c.req.formData();
  const file = formData.get("photo");
  if (!(file instanceof File)) return c.json({ error: "Feld 'photo' fehlt." }, 400);

  const MAX_BYTES = 10 * 1024 * 1024; // 10MB — Regalfotos koennen groesser sein
  if (file.size > MAX_BYTES) return c.json({ error: "Bild zu gross (max 10 MB)." }, 400);

  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `captures/${sessionId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadImage(key, buffer, file.type);

  const photo = await prisma.capturePhoto.create({
    data: { sessionId, storageKey: key, url, bytes: file.size },
  });

  return c.json(photo, 201);
});

// ── Foto loeschen ─────────────────────────────────────────────────────────────

captureSessionsRouter.delete("/:id/photos/:photoId", async (c) => {
  const photo = await prisma.capturePhoto.findUnique({
    where: { id: c.req.param("photoId") },
  });
  if (!photo || photo.sessionId !== c.req.param("id")) {
    return c.json({ error: "Nicht gefunden." }, 404);
  }
  await deleteImage(photo.storageKey);
  await prisma.capturePhoto.delete({ where: { id: photo.id } });
  return c.json({ deleted: true });
});

// ── Session einreichen → Erkennung starten ────────────────────────────────────

captureSessionsRouter.post("/:id/submit", async (c) => {
  const sessionId = c.req.param("id");
  const session = await prisma.captureSession.findUnique({
    where: { id: sessionId },
    include: { photos: true },
  });
  if (!session) return c.json({ error: "Nicht gefunden." }, 404);
  if (session.status !== "open") return c.json({ error: "Session bereits eingereicht." }, 409);
  if (session.photos.length === 0) return c.json({ error: "Keine Fotos vorhanden." }, 400);

  await prisma.captureSession.update({
    where: { id: sessionId },
    data: { status: "recognizing" },
  });

  // Asynchron verarbeiten — Response sofort zurueck
  processSession(sessionId, session.photos).catch((err) => {
    console.error(`Session ${sessionId} recognition failed:`, err);
  });

  return c.json({ id: sessionId, status: "recognizing" });
});

async function processSession(
  sessionId: string,
  photos: { id: string; url: string }[],
) {
  let totalCostCents = 0;

  // Max 5 parallele Aufrufe
  const CONCURRENCY = 5;
  for (let i = 0; i < photos.length; i += CONCURRENCY) {
    const batch = photos.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (photo) => {
        try {
          const { bottles, inputTokens, outputTokens } = await recognizeBottles(photo.url);
          const cost = estimateCostCents(inputTokens, outputTokens);
          totalCostCents += cost;

          await prisma.capturePhoto.update({
            where: { id: photo.id },
            data: { status: "recognized" },
          });

          if (bottles.length > 0) {
            await prisma.recognizedCandidate.createMany({
              data: bottles.map((b) => ({
                sessionId,
                photoId: photo.id,
                name: b.name ?? null,
                producer: b.producer ?? null,
                vintage: b.vintage ?? null,
                region: b.region ?? null,
                country: b.country ?? null,
                type: b.type ?? null,
                confidence: b.confidence ?? null,
                rawJson: b as object,
                bbox: b.bbox ?? null,
              })),
            });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await prisma.capturePhoto.update({
            where: { id: photo.id },
            data: { status: "failed", recognitionError: msg },
          });
        }
      }),
    );
  }

  await prisma.captureSession.update({
    where: { id: sessionId },
    data: {
      status: "ready_for_review",
      costCents: { increment: totalCostCents },
    },
  });
}

// ── Candidate aktualisieren ───────────────────────────────────────────────────

captureSessionsRouter.put("/:id/candidates/:cId", async (c) => {
  const body = await c.req.json();
  const candidate = await prisma.recognizedCandidate.update({
    where: { id: c.req.param("cId") },
    data: {
      name: body.name,
      producer: body.producer,
      vintage: body.vintage,
      region: body.region,
      country: body.country,
      type: body.type,
    },
  });
  return c.json(candidate);
});

captureSessionsRouter.post("/:id/candidates/:cId/reject", async (c) => {
  const candidate = await prisma.recognizedCandidate.update({
    where: { id: c.req.param("cId") },
    data: { status: "rejected" },
  });
  return c.json(candidate);
});
```

### Schritt 4 — Router in `index.ts` registrieren

In `apps/api/src/index.ts` ergaenzen (bestehende Zeilen nicht entfernen):

```typescript
// Import:
import { captureSessionsRouter } from "./routes/captureSessions";

// Route (vor dem /health-Endpoint):
app.route("/api/capture-sessions", captureSessionsRouter);
```

---

## Abschluss

**TypeScript-Check:**
```bash
cd apps/api
npx tsc --noEmit
```

**Commit:**
```
feat(api): capture session routes and Claude Vision batch recognition

- recognition.ts: Claude Vision API wrapper, cost estimation
- routes/captureSessions.ts: CRUD for sessions, photo upload,
  async recognition pipeline with max 5 concurrent calls
- Candidates stored per photo with bbox and confidence
- ANTHROPIC_API_KEY added to .env.example

Phase 0 Task 3
```

**Push:**
```bash
git push -u origin claude/plan-app-architecture-6dUk6
```

---

## Was du NICHT tun sollst

- Kein Finalize-Endpoint in diesem Task (kommt in Task 0.5)
- Kein Web-Frontend-Code
- Keine Synchron-Verarbeitung der Erkennung (wuerde Request-Timeout erzeugen)
- Kein `gpt-4o` oder anderes Modell — nur `claude-sonnet-4-6`
- Kein Loeschen bestehender Routes oder Middleware in `index.ts`
