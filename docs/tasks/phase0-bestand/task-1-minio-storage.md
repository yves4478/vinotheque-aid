# Task 0.1 — MinIO Cloud Storage in Coolify

## Auftrag

Setze MinIO auf dem Coolify-Server auf und integriere es als S3-kompatiblen Storage in die API. Bilder werden ab sofort dort statt in LocalStorage/Base64 abgelegt.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `apps/api/src/storage.ts` (NEU)
- `apps/api/src/routes/wines.ts` (Anpassung)
- `apps/api/prisma/schema.prisma` (Schema-Aenderung)
- `docs/deploy-coolify.md` (Doku-Update)

## Hintergrund

Heute liegen Bilder als Base64 in `localStorage` (Web) und als File-URI auf dem Geraet (Mobile). Das skaliert nicht: bei vielen Bildern sprengt es das Browser-Quota, und Sync zwischen Geraeten gibt es nicht. Phase 0 produziert hunderte Bilder — ohne echten Storage geht das nicht.

## Konkrete Schritte

### 1. MinIO in Coolify deployen

- MinIO als Service in Coolify starten (Standard-Image `minio/minio`)
- Persistenter Volume fuer Daten konfigurieren
- Zugriff: nur intern (Network) oder via Reverse Proxy mit Auth
- Bucket `vinotheque-images` anlegen
- Access Key + Secret Key generieren
- Coolify-Deploy-Doku in `docs/deploy-coolify.md` ergaenzen

### 2. ENV-Variablen

In `apps/api/.env.example` ergaenzen:

```
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=vinotheque-images
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_PUBLIC_URL=https://images.deinedomain.tld
```

### 3. Storage-Modul `apps/api/src/storage.ts`

Verwende `@aws-sdk/client-s3` (S3-kompatibel mit MinIO).

```typescript
export interface ImageStorage {
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

export function createS3Storage(): ImageStorage;
```

Konfiguration aus ENV. Endpoint fuer MinIO setzen, `forcePathStyle: true`.

### 4. Schema-Aenderung

Neue Tabelle `WineImage`:

```prisma
model WineImage {
  id        String   @id @default(cuid())
  wineId    String
  wine      Wine     @relation(fields: [wineId], references: [id], onDelete: Cascade)
  storageKey String  @unique
  url       String
  label     String?
  isPrimary Boolean  @default(false)
  width     Int?
  height    Int?
  bytes     Int?
  createdAt DateTime @default(now())

  @@index([wineId])
}
```

`Wine.images Json?` bleibt vorerst (Backwards-Compat), wird in Phase 2 abgeloest.

Migration: `prisma migrate dev --name add_wine_images_table`.

### 5. API-Endpoints

- `POST /api/wines/:id/images` — Multipart-Upload, max 5 MB, max 3 Bilder pro Wein
  - Validierung: Content-Type, Groesse
  - Upload via Storage-Modul
  - DB-Eintrag in `WineImage`
  - Antwort: `{ id, url, label, isPrimary }`
- `DELETE /api/wines/:id/images/:imageId`
  - Loescht Storage-Objekt + DB-Eintrag

### 6. Bestandsdaten — keine Migration in diesem Task

Die Migration der bestehenden Base64-Bilder ist Teil von Phase 2 Task 5. In Phase 0 sind ohnehin alle Bilder neu (Bulk-Capture).

## Akzeptanzkriterien

- [ ] MinIO laeuft in Coolify, Bucket existiert
- [ ] API kann Bilder hochladen und abrufen
- [ ] Schema-Migration sauber
- [ ] Endpoints funktionieren mit curl-Test
- [ ] ENV-Beispiele aktualisiert
- [ ] Coolify-Doku aktualisiert
- [ ] Lint und Typescheck gruen

## Risiken

- MinIO-Auth-Konfiguration: Public URL muss via Reverse Proxy zugaenglich sein, sonst sind Bilder im Frontend nicht ladbar. Alternative: Signed URLs mit Ablauf.
- Bucket-Policy: kein anonymer Schreibzugriff, nur Read

## Hinweise

- Sub-Pfade in MinIO: `wines/<wineId>/<uuid>.jpg` als Konvention
- Original-Foto NICHT komprimieren auf der API — die Komprimierung erfolgt beim Client (Mobile/Web), siehe bestehende `imageCompression.ts`
