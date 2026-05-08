# Task 5 — Bestandsdaten zu Cloud Storage migrieren

## Auftrag

Migriere die heutigen Base64-Bilder aus `Wine.images` und `localStorage` zu MinIO. Adressiert technische Schuld 7.1 aus dem Backlog.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`

**Entscheid getroffen:** **MinIO auf eigenem Coolify-Server.** S3-kompatibles API, kein Vendor-Lock, Daten bleiben auf eigener Hardware.

**Hinweis:** Das MinIO-Setup und der Storage-Service sind bereits in **Phase 0 Task 1** angelegt. Dieser Task fokussiert sich auf die Migration der Bestandsdaten (Base64 → MinIO).

## Hintergrund

Heute werden Bilder als Base64 in `localStorage` (Web) oder als File-URI im FileSystem (Mobile) gehalten. Bei vielen Bildern stoesst der Speicher an Grenzen, und Sync zwischen Geraeten gibt es nicht.

## Konkrete Schritte

Voraussetzungen aus Phase 0 Task 1:
- MinIO laeuft, Bucket existiert
- `apps/api/src/storage.ts` existiert
- `WineImage`-Tabelle existiert
- API-Endpoints `POST/DELETE /api/wines/:id/images` existieren

### 1. Web-Frontend auf neue Image-API umstellen

- `AddWine.tsx`, `Cellar.tsx`, `Tasting.tsx`, `Wishlist.tsx`: Upload via FormData statt Base64-Embedded
- Anzeige: URL aus `WineImage.url` statt Base64-DataURL
- Bestehende `imageCompression`-Logik bleibt — komprimiert vor Upload

### 2. Mobile-Frontend auf neue Image-API

- Upload via Multipart statt File-URI-Speicherung
- Offline-Fall: in Sync-Queue (Phase 1 Task 5)

### 3. Migrations-Script `scripts/migrate-images-to-storage.ts`

- Iteriert ueber alle Weine mit Base64 in `Wine.images`
- Pro Bild: Decode → Upload zu MinIO → `WineImage`-Eintrag anlegen
- Setzt `isPrimary` korrekt (erstes Bild oder vorhandene Markierung)
- Loescht `Wine.images`-Eintrag nach erfolgreicher Migration
- Idempotent: bei wiederholtem Lauf nur noch nicht migrierte Bilder
- Logs: Anzahl migriert, uebersprungen, fehlgeschlagen

### 4. Backwards-Compat-Phase

- Frontend liest weiterhin alte `Wine.images` falls vorhanden, bevorzugt aber `WineImage.url`
- Nach erfolgreicher Migration: `Wine.images`-Feld in spaeterer Migration entfernen

### 5. Speicherwarnung im Web abschalten

- LocalStorage-Quota-Warning kann entfernt werden, sobald keine Base64-Bilder mehr lokal liegen

## Akzeptanzkriterien

- [ ] Web/Mobile nutzt die neue Image-API
- [ ] Bestehende Base64-Bilder werden ohne Datenverlust migriert
- [ ] Bilder werden korrekt angezeigt (Web und Mobile)
- [ ] Migrations-Script ist idempotent
- [ ] Speicherwarnung im Web verschwindet
- [ ] Lint und Typescheck gruen

## Hinweise

- DB-Backup vor Migration zwingend
- Migration in Test-DB zuerst durchspielen
- Mobile-Anpassung kann zeitversetzt nachgezogen werden, solange Backwards-Compat erhalten bleibt

## Risiken

- Datenverlust bei fehlerhafter Migration → Backup zwingend
- Bilder die nicht migrierbar sind (kaputtes Base64) als Liste reporten, nicht silent skippen
