# Codex Prompt — Phase 0 / Task 1: MinIO Storage & Image-API

## Auftrag

Baue den Cloud-Storage-Layer in die API ein. Ziel: Bilder werden in MinIO (S3-kompatibel) gespeichert statt als Base64 in der Datenbank. Dieser Task legt die Infrastruktur fuer alle nachfolgenden Phase-0-Tasks.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Arbeitsverzeichnis:** `apps/api/`

---

## Was bereits existiert (nicht anfassen)

- `apps/api/src/index.ts` — Hono-App, alle bestehenden Routen registriert
- `apps/api/src/db.ts` — Prisma Client
- `apps/api/src/images.ts` — Validierung von `Wine.images` (bleibt unveraendert)
- `apps/api/prisma/schema.prisma` — bestehende Modelle `Wine`, `WishlistItem`, etc.
- `apps/api/.env.example` — enthaelt heute nur `DATABASE_URL` und `PORT`

---

## Was du baust

### Schritt 1 — Dependency installieren

```bash
cd apps/api
npm install @aws-sdk/client-s3
```

### Schritt 2 — ENV-Variablen erweitern

Ergaenze `apps/api/.env.example` (APPEND, nicht ersetzen):

```
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=vinotheque-images
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_PUBLIC_URL=https://images.example.com
```

### Schritt 3 — Storage-Modul anlegen

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

function buildClient(): S3Client {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY"),
      secretAccessKey: requireEnv("S3_SECRET_KEY"),
    },
    forcePathStyle: true, // MinIO braucht das
  });
}

const client = buildClient();
const bucket = () => requireEnv("S3_BUCKET");
const publicUrl = () => requireEnv("S3_PUBLIC_URL");

export async function uploadImage(
  key: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: data,
      ContentType: contentType,
    }),
  );
  return `${publicUrl()}/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket(), Key: key }),
  ).catch(() => {});
}
```

### Schritt 4 — Prisma-Schema erweitern

Ergaenze in `apps/api/prisma/schema.prisma` folgende zwei Modelle am Ende der Datei:

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

model CapturePhoto {
  id               String          @id @default(cuid())
  sessionId        String
  session          CaptureSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  storageKey       String          @unique
  url              String
  bytes            Int?
  status           String          @default("uploaded")
  recognitionError String?
  createdAt        DateTime        @default(now())
  candidates       RecognizedCandidate[]

  @@index([sessionId])
  @@map("capture_photos")
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

Fuge ausserdem die Relation auf `Wine` ein (bestehenden `Wine`-Block ergaenzen):

```prisma
// In model Wine { ... } ergaenzen:
  wineImages WineImage[]
```

### Schritt 5 — Migration erstellen und anwenden

```bash
cd apps/api
npx prisma migrate dev --name add_storage_and_capture
npx prisma generate
```

### Schritt 6 — Image-Upload-Router anlegen

Neue Datei `apps/api/src/routes/wineImages.ts`:

```typescript
import { Hono } from "hono";
import prisma from "../db";
import { uploadImage, deleteImage } from "../storage";
import { createId } from "@paralleldrive/cuid2";

export const wineImagesRouter = new Hono();

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 3;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

wineImagesRouter.post("/:id/images", async (c) => {
  const wineId = c.req.param("id");
  const formData = await c.req.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return c.json({ error: "Feld 'image' fehlt oder ist kein File." }, 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: "Nur JPEG, PNG und WebP erlaubt." }, 400);
  }
  if (file.size > MAX_BYTES) {
    return c.json({ error: "Bild zu gross (max 5 MB)." }, 400);
  }

  const existing = await prisma.wineImage.count({ where: { wineId } });
  if (existing >= MAX_IMAGES) {
    return c.json({ error: `Maximal ${MAX_IMAGES} Bilder pro Wein.` }, 400);
  }

  const ext = file.type.split("/")[1];
  const key = `wines/${wineId}/${createId()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadImage(key, buffer, file.type);

  const label = formData.get("label")?.toString() ?? undefined;
  const isPrimary = existing === 0; // erstes Bild ist automatisch primary

  const image = await prisma.wineImage.create({
    data: { id: createId(), wineId, storageKey: key, url, label, isPrimary, bytes: file.size },
  });

  return c.json(image, 201);
});

wineImagesRouter.delete("/:id/images/:imageId", async (c) => {
  const image = await prisma.wineImage.findUnique({
    where: { id: c.req.param("imageId") },
  });
  if (!image) return c.json({ error: "Nicht gefunden." }, 404);

  await deleteImage(image.storageKey);
  await prisma.wineImage.delete({ where: { id: image.id } });

  return c.json({ deleted: true });
});
```

**Hinweis:** `@paralleldrive/cuid2` muss installiert werden:

```bash
cd apps/api
npm install @paralleldrive/cuid2
```

### Schritt 7 — Router in index.ts registrieren

In `apps/api/src/index.ts` ergaenzen (bestehende Imports und Route-Registrierungen nicht entfernen):

```typescript
// Import ergaenzen:
import { wineImagesRouter } from "./routes/wineImages";

// Middleware ergaenzen (zusammen mit den anderen wine-Middleware-Zeilen):
app.use("/api/wines/:id/images", requireFeature("inventory"));
app.use("/api/wines/:id/images/*", requireFeature("inventory"));

// Route registrieren (nach app.route("/api/wines", winesRouter)):
app.route("/api/wines", wineImagesRouter);
```

---

## Abschluss

**TypeScript-Check:**
```bash
cd apps/api
npx tsc --noEmit
```

**Smoke-Test (manuell, setzt laufendes MinIO voraus — sonst nur TS-Check):**
Kommentar in Commit wenn MinIO nicht lokal laeuft.

**Commit:**
```
feat(api): add MinIO storage layer and WineImage API

- storage.ts: S3-compatible upload/delete via @aws-sdk/client-s3
- WineImage, CaptureSession, CapturePhoto, RecognizedCandidate Prisma models
- POST/DELETE /api/wines/:id/images endpoints
- .env.example mit S3-Variablen ergaenzt
```

**Push:**
```bash
git push -u origin claude/plan-app-architecture-6dUk6
```

---

## Was du NICHT tun sollst

- Keine Aenderungen an bestehenden Routen (`wines.ts`, `wishlist.ts`, `shopping.ts`)
- Kein Loeschen von `Wine.images Json?` — das ist Backwards-Compat fuer bestehende Daten
- Kein MinIO-Setup in Coolify — das macht der Operator manuell, du lieferst nur den Code
- Keine Migration von bestehenden Base64-Bildern — das kommt in Phase 2 Task 5
- Kein Frontend-Code in diesem Task
