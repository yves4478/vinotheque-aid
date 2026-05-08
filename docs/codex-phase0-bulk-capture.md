# Codex — Phase 0: Keller-Ersterfassung via Bulk-Capture

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`

## Ziel

Baue einen vollstaendigen Flow, damit der Nutzer seinen physischen Weinkeller effizient digital erfassen kann:

1. iPhone-App: Fotos von Regalfaechern aufnehmen (mehrere Flaschen pro Foto)
2. Backend: Claude Vision erkennt alle Flaschen pro Foto automatisch
3. Web-App: Nutzer reviewt und korrigiert die erkannten Kandidaten
4. Web-App: Akzeptierte Kandidaten werden als Weine im Keller gespeichert

**Technologie:** MinIO (S3) fuer Bilder, Anthropic Claude Vision fuer Erkennung.

---

## Manuell — vor dem ersten Commit

Der Operator (nicht Codex) muss folgendes einmalig tun:

- MinIO in Coolify als Service starten (Image `minio/minio`)
- Bucket `vinotheque-images` anlegen
- Access Key + Secret Key generieren
- Diese ENV-Variablen in der API-Umgebung setzen:

```
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=vinotheque-images
S3_ACCESS_KEY=<generierter-key>
S3_SECRET_KEY=<generierter-secret>
S3_PUBLIC_URL=https://images.deinedomain.tld
ANTHROPIC_API_KEY=<anthropic-key>
```

Codex kann ohne laufendes MinIO entwickeln und testen — TypeScript-Check reicht.

---

## Was bereits existiert (nicht anfassen)

```
apps/api/src/index.ts          Hono-App, bestehende Routen
apps/api/src/db.ts             Prisma Client
apps/api/src/images.ts         Validierung Wine.images
apps/api/src/routes/wines.ts   bestehende Wine-CRUD
apps/api/prisma/schema.prisma  Wine, WishlistItem, ShoppingItem, CellarMovement, FeatureFlag
apps/mobile/lib/apiClient.ts   api.wines, api.wishlist etc. + request<T>()
apps/mobile/lib/apiBaseUrl.ts  API_BASE_URL via EXPO_PUBLIC_API_URL
src/lib/apiClient.ts           Web-API-Client mit request<T>()
src/lib/apiBaseUrl.ts          API_BASE_URL via VITE_API_URL
src/features/webFeatures.tsx   WEB_ROUTE_DEFINITIONS[]
src/App.tsx                    React Router mit getEnabledWebRoutes()
```

---

## TASK 1 — API: Dependencies + Storage-Modul

### 1.1 Dependencies installieren

```bash
cd apps/api
npm install @aws-sdk/client-s3 @anthropic-ai/sdk @paralleldrive/cuid2
```

### 1.2 ENV-Beispieldatei ergaenzen

Datei `apps/api/.env.example` — APPEND (bestehende Zeilen nicht entfernen):

```
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=vinotheque-images
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_PUBLIC_URL=https://images.example.com
ANTHROPIC_API_KEY=
```

### 1.3 Storage-Modul anlegen

Neue Datei `apps/api/src/storage.ts`:

```typescript
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: requireEnv("S3_ACCESS_KEY"),
    secretAccessKey: requireEnv("S3_SECRET_KEY"),
  },
  forcePathStyle: true,
});

const bucket = () => requireEnv("S3_BUCKET");
const publicUrl = () => requireEnv("S3_PUBLIC_URL");

export async function uploadImage(
  key: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  await client.send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body: data, ContentType: contentType }),
  );
  return `${publicUrl()}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key })).catch(() => {});
}
```

---

## TASK 2 — API: Prisma-Schema erweitern

### 2.1 schema.prisma erweitern

In `apps/api/prisma/schema.prisma`:

**a) Relation auf bestehendem `Wine`-Modell hinzufuegen** — innerhalb des `model Wine { ... }` Blocks ergaenzen:

```prisma
  wineImages WineImage[]
```

**b) Vier neue Modelle am Ende der Datei anhaengen:**

```prisma
model WineImage {
  id         String   @id @default(cuid())
  wineId     String
  wine       Wine     @relation(fields: [wineId], references: [id], onDelete: Cascade)
  storageKey String   @unique
  url        String
  label      String?
  isPrimary  Boolean  @default(false)
  bytes      Int?
  createdAt  DateTime @default(now())

  @@index([wineId])
  @@map("wine_images")
}

model CaptureSession {
  id         String                @id @default(cuid())
  status     String                @default("open")
  costCents  Int                   @default(0)
  createdAt  DateTime              @default(now())
  updatedAt  DateTime              @updatedAt
  photos     CapturePhoto[]
  candidates RecognizedCandidate[]

  @@map("capture_sessions")
}

model CapturePhoto {
  id               String                @id @default(cuid())
  sessionId        String
  session          CaptureSession        @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  storageKey       String                @unique
  url              String
  bytes            Int?
  status           String                @default("uploaded")
  recognitionError String?
  createdAt        DateTime              @default(now())
  candidates       RecognizedCandidate[]

  @@index([sessionId])
  @@map("capture_photos")
}

model RecognizedCandidate {
  id           String         @id @default(cuid())
  sessionId    String
  session      CaptureSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  photoId      String
  photo        CapturePhoto   @relation(fields: [photoId], references: [id], onDelete: Cascade)
  name         String?
  producer     String?
  vintage      Int?
  region       String?
  country      String?
  type         String?
  confidence   Float?
  rawJson      Json
  status       String         @default("pending")
  linkedWineId String?
  bbox         Json?
  createdAt    DateTime       @default(now())

  @@index([sessionId])
  @@index([photoId])
  @@map("recognized_candidates")
}
```

### 2.2 Migration ausfuehren

```bash
cd apps/api
npx prisma migrate dev --name add_storage_and_capture
npx prisma generate
```

---

## TASK 3 — API: Recognition-Modul

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

const PROMPT = `Du analysierst ein Foto eines Weinregals.
Identifiziere alle Flaschen, deren Etikett du lesen kannst.
Antworte ausschliesslich als JSON-Array. Jedes Objekt hat diese optionalen Felder:
{"name":string,"producer":string,"vintage":number,"region":string,"country":string,"type":"rot|weiss|rose|schaumwein|dessert","confidence":0.0-1.0,"bbox":{"x":0-1,"y":0-1,"w":0-1,"h":0-1}}
Lasse Felder weg, die du nicht sicher erkennst. Nur JSON, keine Erklaerungen.`;

export async function recognizeBottles(imageUrl: string): Promise<{
  bottles: RecognizedBottle[];
  inputTokens: number;
  outputTokens: number;
}> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "url", url: imageUrl } },
        { type: "text", text: PROMPT },
      ],
    }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let bottles: RecognizedBottle[] = [];
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) bottles = JSON.parse(match[0]) as RecognizedBottle[];
  } catch { /* leeres Array */ }

  return { bottles, inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };
}

// claude-sonnet-4-6: $3/MTok input, $15/MTok output → in Cent
export function estimateCostCents(input: number, output: number): number {
  return Math.round((input / 1_000_000) * 300 + (output / 1_000_000) * 1500);
}
```

---

## TASK 4 — API: Capture Session Routes

### 4.1 Router anlegen

Neue Datei `apps/api/src/routes/captureSessions.ts`:

```typescript
import { Hono } from "hono";
import prisma from "../db";
import { uploadImage, deleteImage } from "../storage";
import { recognizeBottles, estimateCostCents } from "../recognition";
import { createId } from "@paralleldrive/cuid2";

export const captureSessionsRouter = new Hono();

captureSessionsRouter.post("/", async (c) => {
  const session = await prisma.captureSession.create({ data: {} });
  return c.json(session, 201);
});

captureSessionsRouter.get("/", async (c) => {
  const sessions = await prisma.captureSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true, candidates: true } } },
  });
  return c.json(sessions);
});

captureSessionsRouter.get("/:id", async (c) => {
  const session = await prisma.captureSession.findUnique({
    where: { id: c.req.param("id") },
    include: { photos: true, candidates: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json(session);
});

captureSessionsRouter.post("/:id/photos", async (c) => {
  const sessionId = c.req.param("id");
  const session = await prisma.captureSession.findUnique({ where: { id: sessionId } });
  if (!session) return c.json({ error: "Session nicht gefunden." }, 404);
  if (session.status !== "open") return c.json({ error: "Session ist nicht offen." }, 409);

  const formData = await c.req.formData();
  const file = formData.get("photo");
  if (!(file instanceof File)) return c.json({ error: "Feld 'photo' fehlt." }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ error: "Max 10 MB." }, 400);

  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `captures/${sessionId}/${createId()}.${ext}`;
  const url = await uploadImage(key, Buffer.from(await file.arrayBuffer()), file.type);
  const photo = await prisma.capturePhoto.create({
    data: { id: createId(), sessionId, storageKey: key, url, bytes: file.size },
  });
  return c.json(photo, 201);
});

captureSessionsRouter.delete("/:id/photos/:photoId", async (c) => {
  const photo = await prisma.capturePhoto.findUnique({ where: { id: c.req.param("photoId") } });
  if (!photo || photo.sessionId !== c.req.param("id")) return c.json({ error: "Nicht gefunden." }, 404);
  await deleteImage(photo.storageKey);
  await prisma.capturePhoto.delete({ where: { id: photo.id } });
  return c.json({ deleted: true });
});

captureSessionsRouter.post("/:id/submit", async (c) => {
  const sessionId = c.req.param("id");
  const session = await prisma.captureSession.findUnique({
    where: { id: sessionId },
    include: { photos: true },
  });
  if (!session) return c.json({ error: "Nicht gefunden." }, 404);
  if (session.status !== "open") return c.json({ error: "Bereits eingereicht." }, 409);
  if (session.photos.length === 0) return c.json({ error: "Keine Fotos." }, 400);

  await prisma.captureSession.update({ where: { id: sessionId }, data: { status: "recognizing" } });
  processSession(sessionId, session.photos).catch((err) =>
    console.error(`Session ${sessionId} failed:`, err),
  );
  return c.json({ id: sessionId, status: "recognizing" });
});

async function processSession(sessionId: string, photos: { id: string; url: string }[]) {
  let totalCostCents = 0;
  const CONCURRENCY = 5;
  for (let i = 0; i < photos.length; i += CONCURRENCY) {
    await Promise.all(
      photos.slice(i, i + CONCURRENCY).map(async (photo) => {
        try {
          const { bottles, inputTokens, outputTokens } = await recognizeBottles(photo.url);
          totalCostCents += estimateCostCents(inputTokens, outputTokens);
          await prisma.capturePhoto.update({ where: { id: photo.id }, data: { status: "recognized" } });
          if (bottles.length > 0) {
            await prisma.recognizedCandidate.createMany({
              data: bottles.map((b) => ({
                id: createId(),
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
          await prisma.capturePhoto.update({
            where: { id: photo.id },
            data: { status: "failed", recognitionError: String(err) },
          });
        }
      }),
    );
  }
  await prisma.captureSession.update({
    where: { id: sessionId },
    data: { status: "ready_for_review", costCents: { increment: totalCostCents } },
  });
}

captureSessionsRouter.put("/:id/candidates/:cId", async (c) => {
  const body = await c.req.json();
  const candidate = await prisma.recognizedCandidate.update({
    where: { id: c.req.param("cId") },
    data: { name: body.name, producer: body.producer, vintage: body.vintage, region: body.region, country: body.country, type: body.type },
  });
  return c.json(candidate);
});

captureSessionsRouter.post("/:id/candidates/:cId/accept", async (c) => {
  const candidate = await prisma.recognizedCandidate.update({
    where: { id: c.req.param("cId") },
    data: { status: "accepted" },
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

captureSessionsRouter.post("/:id/finalize", async (c) => {
  const sessionId = c.req.param("id");
  const session = await prisma.captureSession.findUnique({
    where: { id: sessionId },
    include: { candidates: { include: { photo: true } } },
  });
  if (!session) return c.json({ error: "Nicht gefunden." }, 404);
  if (session.status === "completed") return c.json({ error: "Bereits abgeschlossen." }, 409);

  const body = await c.req.json() as {
    saves: Array<{
      candidateId: string;
      action: "create" | "addToExisting";
      wineId?: string;
      quantity: number;
      fields?: { name?: string; producer?: string; vintage?: number; region?: string; country?: string; type?: string; notes?: string };
    }>;
  };

  const now = new Date().toISOString();
  let created = 0;
  let merged = 0;

  await prisma.$transaction(async (tx) => {
    for (const save of body.saves) {
      const candidate = session.candidates.find((c) => c.id === save.candidateId);
      if (!candidate) continue;
      const qty = Math.max(1, save.quantity ?? 1);
      const f = save.fields ?? {};

      if (save.action === "create") {
        const wineId = createId();
        await tx.wine.create({
          data: {
            id: wineId,
            name: f.name ?? candidate.name ?? "Unbekannt",
            producer: f.producer ?? candidate.producer ?? "",
            vintage: f.vintage ?? candidate.vintage ?? 0,
            region: f.region ?? candidate.region ?? "",
            country: f.country ?? candidate.country ?? "",
            type: f.type ?? candidate.type ?? "rot",
            grape: "",
            quantity: qty,
            notes: f.notes ?? null,
          },
        });
        await tx.wineImage.create({
          data: {
            id: createId(),
            wineId,
            storageKey: candidate.photo.storageKey,
            url: candidate.photo.url,
            label: "Erfassung",
            isPrimary: true,
          },
        });
        await tx.cellarMovement.create({
          data: {
            id: createId(),
            type: "in",
            wineId,
            wineName: f.name ?? candidate.name ?? "Unbekannt",
            wineProducer: f.producer ?? candidate.producer ?? "",
            wineVintage: f.vintage ?? candidate.vintage ?? 0,
            wineType: f.type ?? candidate.type ?? "rot",
            quantity: qty,
            date: now,
            occasion: "Keller-Ersterfassung",
          },
        });
        await tx.recognizedCandidate.update({
          where: { id: candidate.id },
          data: { status: "accepted", linkedWineId: wineId },
        });
        created++;

      } else if (save.action === "addToExisting" && save.wineId) {
        const existing = await tx.wine.findUnique({ where: { id: save.wineId } });
        if (!existing) continue;
        await tx.wine.update({ where: { id: save.wineId }, data: { quantity: { increment: qty } } });
        await tx.cellarMovement.create({
          data: {
            id: createId(),
            type: "in",
            wineId: save.wineId,
            wineName: existing.name,
            wineProducer: existing.producer,
            wineVintage: existing.vintage,
            wineType: existing.type,
            quantity: qty,
            date: now,
            occasion: "Keller-Ersterfassung",
          },
        });
        await tx.recognizedCandidate.update({
          where: { id: candidate.id },
          data: { status: "merged", linkedWineId: save.wineId },
        });
        merged++;
      }
    }
    await tx.captureSession.update({ where: { id: sessionId }, data: { status: "completed" } });
  });

  return c.json({ created, merged, status: "completed" });
});
```

### 4.2 Router in `apps/api/src/index.ts` registrieren

Ergaenze in `apps/api/src/index.ts` (bestehende Zeilen nicht entfernen):

```typescript
// Import-Zeile ergaenzen:
import { captureSessionsRouter } from "./routes/captureSessions";

// Route registrieren (vor dem /health-Endpoint):
app.route("/api/capture-sessions", captureSessionsRouter);
```

### 4.3 TypeScript-Check API

```bash
cd apps/api
npx tsc --noEmit
```

---

## TASK 5 — iOS: Bulk-Capture Aufnahme-Screen

### 5.1 API-Client fuer Capture Sessions

Neue Datei `apps/mobile/lib/captureApi.ts`:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export type CaptureSessionStatus =
  | "open" | "submitted" | "recognizing" | "ready_for_review" | "completed";

export type CaptureSession = {
  id: string;
  status: CaptureSessionStatus;
  createdAt: string;
  costCents: number;
};

export type CapturePhotoItem = {
  id: string;
  url: string;
  status: "uploading" | "uploaded" | "failed";
};

export const ACTIVE_SESSION_KEY = "vinotheque.activeCaptureSession";

export async function createCaptureSession(): Promise<CaptureSession> {
  const res = await fetch(`${API_BASE_URL}/api/capture-sessions`, { method: "POST" });
  if (!res.ok) throw new Error("Session konnte nicht erstellt werden.");
  return res.json();
}

export async function uploadCapturePhoto(sessionId: string, localUri: string): Promise<CapturePhotoItem> {
  const formData = new FormData();
  formData.append("photo", { uri: localUri, name: "photo.jpg", type: "image/jpeg" } as never);
  const res = await fetch(`${API_BASE_URL}/api/capture-sessions/${sessionId}/photos`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload fehlgeschlagen.");
  return res.json();
}

export async function deleteCapturePhoto(sessionId: string, photoId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/capture-sessions/${sessionId}/photos/${photoId}`, { method: "DELETE" });
}

export async function submitCaptureSession(sessionId: string): Promise<CaptureSession> {
  const res = await fetch(`${API_BASE_URL}/api/capture-sessions/${sessionId}/submit`, { method: "POST" });
  if (!res.ok) throw new Error("Submit fehlgeschlagen.");
  return res.json();
}

export async function saveActiveSessionId(id: string) {
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, id);
}
export async function clearActiveSessionId() {
  await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
}
```

### 5.2 Capture Screen

Neue Datei `apps/mobile/app/capture/index.tsx`:

```typescript
import {
  ActivityIndicator, Alert, FlatList, Image,
  Pressable, StyleSheet, Text, View,
} from "react-native";
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  createCaptureSession, uploadCapturePhoto, deleteCapturePhoto,
  submitCaptureSession, saveActiveSessionId, clearActiveSessionId,
  type CapturePhotoItem,
} from "@/lib/captureApi";

type LocalPhoto = CapturePhotoItem & { localUri: string };

export default function CaptureScreen() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const s = await createCaptureSession();
    await saveActiveSessionId(s.id);
    setSessionId(s.id);
    return s.id;
  }

  const handleAddPhoto = useCallback(async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled) return;
    const localUri = result.assets[0].uri;
    const placeholder: LocalPhoto = { id: `local-${Date.now()}`, url: localUri, localUri, status: "uploading" };
    setPhotos((prev) => [...prev, placeholder]);
    try {
      const sid = await ensureSession();
      const uploaded = await uploadCapturePhoto(sid, localUri);
      setPhotos((prev) => prev.map((p) =>
        p.id === placeholder.id ? { ...uploaded, localUri, status: "uploaded" } : p,
      ));
    } catch {
      setPhotos((prev) => prev.map((p) =>
        p.id === placeholder.id ? { ...p, status: "failed" } : p,
      ));
    }
  }, [sessionId]);

  const handleDelete = useCallback(async (photo: LocalPhoto) => {
    if (!sessionId || photo.status === "uploading") return;
    Alert.alert("Foto loeschen?", "", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Loeschen", style: "destructive", onPress: async () => {
          if (photo.status === "uploaded") await deleteCapturePhoto(sessionId, photo.id).catch(() => {});
          setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
        },
      },
    ]);
  }, [sessionId]);

  const handleSubmit = useCallback(async () => {
    if (!sessionId) return;
    const ready = photos.filter((p) => p.status === "uploaded");
    if (ready.length === 0) { Alert.alert("Keine Fotos", "Bitte zuerst Fotos aufnehmen."); return; }
    setSubmitting(true);
    try {
      await submitCaptureSession(sessionId);
      await clearActiveSessionId();
      Alert.alert(
        "Erkennung gestartet",
        `${ready.length} Foto${ready.length !== 1 ? "s" : ""} werden analysiert.\nReview in der Web-App.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch { Alert.alert("Fehler", "Session konnte nicht abgeschlossen werden."); }
    finally { setSubmitting(false); }
  }, [sessionId, photos, router]);

  const uploaded = photos.filter((p) => p.status === "uploaded").length;

  return (
    <View style={s.container}>
      <Text style={s.title}>Keller erfassen</Text>
      <Text style={s.hint}>Fotografiere Regalfaecher — mehrere Flaschen pro Bild sind ideal.</Text>
      <FlatList
        data={photos}
        numColumns={2}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.grid}
        renderItem={({ item }) => (
          <Pressable style={s.thumb} onLongPress={() => handleDelete(item)}>
            <Image source={{ uri: item.localUri }} style={s.thumbImg} />
            {item.status === "uploading" && (
              <View style={s.overlay}><ActivityIndicator color="#fff" /></View>
            )}
            {item.status === "failed" && (
              <View style={s.overlay}><Text style={s.failTxt}>!</Text></View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={s.empty}>Noch keine Fotos. Tippe auf +.</Text>}
      />
      <View style={s.footer}>
        <Pressable style={s.addBtn} onPress={handleAddPhoto}>
          <Text style={s.addBtnTxt}>+ Foto aufnehmen</Text>
        </Pressable>
        {photos.length > 0 && (
          <Pressable style={[s.submitBtn, submitting && s.disabled]} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitBtnTxt}>Fertig — {uploaded} Foto{uploaded !== 1 ? "s" : ""} senden</Text>}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#0f0e0d", padding: 16 },
  title:       { fontSize: 22, fontWeight: "700", color: "#e8d5b0", marginBottom: 6 },
  hint:        { fontSize: 13, color: "#888", marginBottom: 16 },
  grid:        { gap: 8, paddingBottom: 120 },
  thumb:       { flex: 1, margin: 4, aspectRatio: 1, borderRadius: 8, overflow: "hidden", backgroundColor: "#1a1a1a" },
  thumbImg:    { width: "100%", height: "100%" },
  overlay:     { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#00000088", justifyContent: "center", alignItems: "center" },
  failTxt:     { fontSize: 24, color: "#ff4444", fontWeight: "700" },
  empty:       { color: "#555", textAlign: "center", marginTop: 60 },
  footer:      { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, gap: 10, backgroundColor: "#0f0e0d" },
  addBtn:      { backgroundColor: "#7c1f1f", padding: 16, borderRadius: 10, alignItems: "center" },
  addBtnTxt:   { color: "#e8d5b0", fontSize: 16, fontWeight: "600" },
  submitBtn:   { backgroundColor: "#2d5a2d", padding: 16, borderRadius: 10, alignItems: "center" },
  submitBtnTxt:{ color: "#e8d5b0", fontSize: 16, fontWeight: "600" },
  disabled:    { opacity: 0.5 },
});
```

### 5.3 Einstiegspunkt in bestehendem Add-Tab

In `apps/mobile/app/(tabs)/add.tsx` — suche die JSX-Stelle wo es Sinn macht (z.B. ganz oben vor dem Hauptformular oder als eigene Sektion) und fuege ein:

```typescript
import { useRouter } from "expo-router";

// Im Funktionskoerper:
const router = useRouter();

// Im JSX — als Card/Banner ganz oben:
<Pressable
  onPress={() => router.push("/capture")}
  style={{ backgroundColor: "#1a0a0a", borderRadius: 10, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#7c1f1f" }}
>
  <Text style={{ color: "#e8d5b0", fontWeight: "700", fontSize: 16 }}>Keller erfassen</Text>
  <Text style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
    Mehrere Flaschen per Foto — ideal fuer die Ersterfassung
  </Text>
</Pressable>
```

### 5.4 TypeScript-Check Mobile

```bash
cd apps/mobile
npx tsc --noEmit -p tsconfig.json
```

---

## TASK 6 — Web: React Query Hooks fuer Capture

Neue Datei `src/hooks/useCaptureSession.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

function req<T>(path: string, init?: RequestInit): Promise<T> {
  return fetch(`${API_BASE_URL}${path}`, init).then((r) => {
    if (!r.ok) return r.json().then((e) => Promise.reject(e));
    return r.json() as Promise<T>;
  });
}

export type CaptureSessionStatus =
  | "open" | "submitted" | "recognizing" | "ready_for_review" | "completed";

export type CaptureSessionListItem = {
  id: string; status: CaptureSessionStatus; createdAt: string; costCents: number;
  _count: { photos: number; candidates: number };
};

export type CapturePhoto = { id: string; url: string; status: string };

export type Candidate = {
  id: string; photoId: string;
  name: string | null; producer: string | null; vintage: number | null;
  region: string | null; country: string | null; type: string | null;
  confidence: number | null; status: string;
  bbox: { x: number; y: number; w: number; h: number } | null;
};

export type CaptureSessionDetail = {
  id: string; status: CaptureSessionStatus; costCents: number; createdAt: string;
  photos: CapturePhoto[]; candidates: Candidate[];
};

export type SaveEntry = {
  candidateId: string; action: "create" | "addToExisting";
  wineId?: string; quantity: number;
  fields?: { name?: string; producer?: string; vintage?: number; region?: string; country?: string; type?: string };
};

export function useCaptureSessions() {
  return useQuery<CaptureSessionListItem[]>({
    queryKey: ["capture-sessions"],
    queryFn: () => req("/api/capture-sessions"),
    refetchInterval: (q) => {
      const active = (q.state.data ?? []).some((s: CaptureSessionListItem) =>
        ["submitted", "recognizing"].includes(s.status));
      return active ? 5000 : false;
    },
  });
}

export function useCaptureSession(id: string) {
  return useQuery<CaptureSessionDetail>({
    queryKey: ["capture-session", id],
    queryFn: () => req(`/api/capture-sessions/${id}`),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "recognizing" || s === "submitted" ? 3000 : false;
    },
  });
}

export function useUpdateCandidate(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Candidate> }) =>
      req(`/api/capture-sessions/${sessionId}/candidates/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capture-session", sessionId] }),
  });
}

export function useAcceptCandidate(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (candidateId: string) =>
      req(`/api/capture-sessions/${sessionId}/candidates/${candidateId}/accept`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capture-session", sessionId] }),
  });
}

export function useRejectCandidate(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (candidateId: string) =>
      req(`/api/capture-sessions/${sessionId}/candidates/${candidateId}/reject`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["capture-session", sessionId] }),
  });
}

export function useFinalizeCaptureSession(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (saves: SaveEntry[]) =>
      req(`/api/capture-sessions/${sessionId}/finalize`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ saves }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["capture-session", sessionId] });
      qc.invalidateQueries({ queryKey: ["capture-sessions"] });
      qc.invalidateQueries({ queryKey: ["wines"] });
    },
  });
}
```

---

## TASK 7 — Web: Sessions-Uebersicht

Neue Datei `src/pages/CaptureSessions.tsx`:

```typescript
import { Link } from "react-router-dom";
import { useCaptureSessions } from "@/hooks/useCaptureSession";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  open: "Offen", submitted: "Eingereicht", recognizing: "Wird analysiert…",
  ready_for_review: "Review bereit", completed: "Abgeschlossen",
};
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ready_for_review: "default", recognizing: "secondary", completed: "outline",
};

export default function CaptureSessions() {
  const { data: sessions = [], isLoading } = useCaptureSessions();
  if (isLoading) return <div className="p-8 text-muted-foreground">Lade Sessions…</div>;
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Keller erfassen</h1>
      <p className="text-muted-foreground mb-6">
        Starte die Aufnahme in der iOS-App. Die Erkennung laeuft hier automatisch.
      </p>
      {sessions.length === 0 && (
        <p className="text-muted-foreground">Noch keine Sessions vorhanden.</p>
      )}
      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <Link key={s.id} to={`/capture/${s.id}`}>
            <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div>
                  <p className="font-medium">
                    {new Date(s.createdAt).toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {s._count.photos} Foto{s._count.photos !== 1 ? "s" : ""} ·{" "}
                    {s._count.candidates} Kandidat{s._count.candidates !== 1 ? "en" : ""} ·{" "}
                    CHF {(s.costCents / 100).toFixed(2)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

## TASK 8 — Web: Review-UI

Neue Datei `src/pages/CaptureReview.tsx`:

```typescript
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useCaptureSession, useUpdateCandidate, useAcceptCandidate,
  useRejectCandidate, useFinalizeCaptureSession,
  type Candidate, type SaveEntry,
} from "@/hooks/useCaptureSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function CaptureReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = useCaptureSession(id!);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [saves, setSaves] = useState<Map<string, SaveEntry>>(new Map());
  const updateCandidate = useUpdateCandidate(id!);
  const acceptCandidate = useAcceptCandidate(id!);
  const rejectCandidate = useRejectCandidate(id!);
  const finalize = useFinalizeCaptureSession(id!);

  if (isLoading || !session) return <div className="p-8">Lade Session…</div>;

  if (["submitted", "recognizing"].includes(session.status)) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-xl font-semibold animate-pulse">Erkennung laeuft…</p>
        <p className="text-muted-foreground">Die Seite aktualisiert sich automatisch.</p>
      </div>
    );
  }

  const currentPhotoId = selectedPhotoId ?? session.photos[0]?.id;
  const currentPhoto = session.photos.find((p) => p.id === currentPhotoId);
  const candidatesForPhoto = session.candidates.filter(
    (c) => c.photoId === currentPhotoId && c.status !== "rejected",
  );
  const accepted = session.candidates.filter((c) => c.status === "accepted").length;
  const total = session.candidates.length;

  function handleAccept(c: Candidate, quantity: number) {
    acceptCandidate.mutate(c.id);
    setSaves((prev) => {
      const m = new Map(prev);
      m.set(c.id, {
        candidateId: c.id, action: "create", quantity,
        fields: { name: c.name ?? undefined, producer: c.producer ?? undefined, vintage: c.vintage ?? undefined, region: c.region ?? undefined, country: c.country ?? undefined, type: c.type ?? undefined },
      });
      return m;
    });
  }

  async function handleFinalize() {
    if (saves.size === 0) return;
    try {
      const result = await finalize.mutateAsync(Array.from(saves.values())) as { created: number; merged: number };
      alert(`${result.created} Wein${result.created !== 1 ? "e" : ""} erstellt, ${result.merged} Menge${result.merged !== 1 ? "n" : ""} erhoeht.`);
      navigate("/cellar");
    } catch { alert("Fehler beim Speichern."); }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold">Review</h1>
          <p className="text-sm text-muted-foreground">
            {accepted} akzeptiert · {total} Kandidaten · CHF {(session.costCents / 100).toFixed(2)}
          </p>
        </div>
        <Button
          onClick={handleFinalize}
          disabled={saves.size === 0 || finalize.isPending}
        >
          {finalize.isPending ? "Speichere…" : `${saves.size} Wein${saves.size !== 1 ? "e" : ""} in Keller`}
        </Button>
      </div>

      {/* Body zweispaltig */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Linke Spalte: Foto */}
        <div className="md:w-1/2 flex flex-col gap-3 p-4 overflow-y-auto border-r">
          <div className="flex gap-2 flex-wrap">
            {session.photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelectedPhotoId(p.id)}
                className={`px-3 py-1 rounded text-sm border transition-colors ${p.id === currentPhotoId ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Foto {i + 1}
              </button>
            ))}
          </div>
          {currentPhoto && (
            <div className="relative w-full">
              <img src={currentPhoto.url} alt="Regalfoto" className="w-full rounded-lg object-contain" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1 1" preserveAspectRatio="none">
                {candidatesForPhoto.filter((c) => c.bbox).map((c) => (
                  <rect key={c.id} x={c.bbox!.x} y={c.bbox!.y} width={c.bbox!.w} height={c.bbox!.h}
                    fill="transparent" stroke="#e8d5b0" strokeWidth="0.004" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Rechte Spalte: Kandidaten */}
        <div className="md:w-1/2 overflow-y-auto p-4 flex flex-col gap-3">
          {candidatesForPhoto.length === 0 && (
            <p className="text-muted-foreground text-sm">Keine Kandidaten fuer dieses Foto.</p>
          )}
          {candidatesForPhoto.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              isQueued={saves.has(c.id)}
              onAccept={(qty) => handleAccept(c, qty)}
              onUpdate={(data) => updateCandidate.mutate({ id: c.id, data })}
              onReject={() => { rejectCandidate.mutate(c.id); setSaves((prev) => { const m = new Map(prev); m.delete(c.id); return m; }); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CandidateCard({ candidate: c, isQueued, onAccept, onUpdate, onReject }: {
  candidate: Candidate;
  isQueued: boolean;
  onAccept: (qty: number) => void;
  onUpdate: (data: Partial<Candidate>) => void;
  onReject: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(1);
  const [draft, setDraft] = useState({
    name: c.name ?? "", producer: c.producer ?? "", vintage: c.vintage?.toString() ?? "",
  });

  return (
    <Card className={isQueued ? "border-green-600 bg-green-950/10" : c.status === "rejected" ? "opacity-40" : ""}>
      <CardContent className="py-3 px-4 flex flex-col gap-2">
        {editing ? (
          <>
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Weinname" />
            <Input value={draft.producer} onChange={(e) => setDraft((d) => ({ ...d, producer: e.target.value }))} placeholder="Produzent" />
            <Input value={draft.vintage} onChange={(e) => setDraft((d) => ({ ...d, vintage: e.target.value }))} placeholder="Jahrgang" type="number" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { onUpdate({ name: draft.name, producer: draft.producer, vintage: parseInt(draft.vintage) || undefined }); setEditing(false); }}>OK</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Abbrechen</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{c.name ?? <span className="text-muted-foreground italic">Unbekannt</span>}</p>
                <p className="text-sm text-muted-foreground">{[c.producer, c.vintage].filter(Boolean).join(" · ")}</p>
                <p className="text-xs text-muted-foreground">{[c.region, c.country, c.type].filter(Boolean).join(" · ")}</p>
              </div>
              {c.confidence != null && (
                <Badge variant="outline" className="text-xs shrink-0">{Math.round(c.confidence * 100)}%</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!isQueued && (
                <>
                  <input
                    type="number" min={1} max={99} value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 border rounded px-2 py-1 text-sm bg-background"
                  />
                  <Button size="sm" className="bg-green-700 hover:bg-green-600" onClick={() => onAccept(qty)}>
                    Akzeptieren
                  </Button>
                </>
              )}
              {isQueued && <Badge className="bg-green-700">Akzeptiert ({qty}×)</Badge>}
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Bearbeiten</Button>
              <Button size="sm" variant="destructive" onClick={onReject}>Verwerfen</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## TASK 9 — Web: Routing registrieren

In `src/features/webFeatures.tsx`:

**a) Imports ergaenzen (oben, bei den anderen Imports):**

```typescript
import CaptureSessions from "@/pages/CaptureSessions";
```

**b) In `WEB_ROUTE_DEFINITIONS` einen Eintrag hinzufuegen** (z.B. nach der Tasting-Zeile):

```typescript
{ path: "/capture", label: "Keller erfassen", icon: Camera, element: <CaptureSessions />, featureKey: "inventory", showInNavigation: true },
```

`Camera` ist bereits in den Lucide-Importen vorhanden.

**c) Detail-Route in `src/App.tsx` direkt hinzufuegen** (sie benoetigt keinen Feature-Flag-Guard und hat einen URL-Parameter):

```typescript
// Import ergaenzen:
import CaptureReview from "@/pages/CaptureReview";

// In AppRoutes, innerhalb von <Routes>, vor dem * Route:
<Route path="/capture/:id" element={<CaptureReview />} />
```

---

## Abschluss

### TypeScript-Checks

```bash
cd apps/api && npx tsc --noEmit
cd ../..
npx tsc --noEmit 2>/dev/null || true
cd apps/mobile && npx tsc --noEmit -p tsconfig.json
```

### Lint

```bash
cd /workspace/vinotheque-aid  # oder Repo-Root
npm run lint 2>/dev/null || true
```

### Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: Phase 0 - Keller-Ersterfassung via Bulk-Capture

API (apps/api):
- storage.ts: MinIO/S3-kompatibler Bild-Upload via @aws-sdk/client-s3
- recognition.ts: Claude Vision Batch-Erkennung mehrerer Flaschen pro Foto
- routes/captureSessions.ts: vollstaendige CRUD + submit + finalize
- Prisma: WineImage, CaptureSession, CapturePhoto, RecognizedCandidate

iOS (apps/mobile):
- lib/captureApi.ts: API-Client fuer Capture Sessions
- app/capture/index.tsx: Foto-Aufnahme-Screen mit Upload-Status
- Einstiegspunkt im Add-Tab

Web (src):
- hooks/useCaptureSession.ts: React Query Hooks mit Auto-Polling
- pages/CaptureSessions.tsx: Session-Liste mit Status-Badges
- pages/CaptureReview.tsx: zweispaltige Review-UI mit Bounding Boxes,
  Kandidaten-Cards, Akzeptieren/Verwerfen, Finalize
- Routing in webFeatures.tsx und App.tsx

EOF
)"
```

### Push

```bash
git push -u origin claude/plan-app-architecture-6dUk6
```

---

## Was du NICHT tun sollst

- Keine bestehenden Routen, Models oder Middleware loeschen
- `Wine.images Json?` bleibt — Backwards-Compat fuer bestehende Daten
- Kein MinIO-Deployment — nur Code
- Keine Migration der bestehenden Base64-Bilder — kommt spaeter
- Kein `eas build` oder `expo run:ios`
- Keinen zweiten Finalize-Aufruf erlauben — der 409-Guard im Backend reicht
- Kein neues UI-Framework — nur bestehende shadcn/ui Komponenten
