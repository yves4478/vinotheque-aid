# Task 5 — Cloud Storage fuer Bilder

## Auftrag

Ersetze die heutige Base64-/LocalStorage-Bildablage durch echten Cloud Storage. Adressiert technische Schuld 7.1 aus dem Backlog.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`

**Strategischer Entscheid noetig BEFORE Start:** Welcher Storage-Provider?
- **Supabase Storage** (S3-kompatibel, einfache Integration, kostenlos bis 1GB)
- **AWS S3** (Standard, mehr Konfiguration noetig)
- **Eigener Server** mit Volume (Coolify-Deployment hat Volumes)

**Vorschlag:** Supabase Storage. Einfachster Pfad, freier Tier reicht fuer den Anfang. Falls Bedenken: Diskussion in Issue, **vor** Start dieses Tasks.

## Hintergrund

Heute werden Bilder als Base64 in `localStorage` (Web) oder als File-URI im FileSystem (Mobile) gehalten. Bei vielen Bildern stoesst der Speicher an Grenzen, und Sync zwischen Geraeten gibt es nicht.

## Konkrete Schritte

1. **Storage-Service in API**
   - `apps/api/src/storage.ts` mit Interface:
     ```typescript
     export interface ImageStorage {
       upload(key: string, data: Buffer, contentType: string): Promise<string>; // returns URL
       delete(key: string): Promise<void>;
       getSignedUrl?(key: string, expiresIn: number): Promise<string>;
     }
     ```
   - Implementierung `SupabaseImageStorage` (oder gewaehlter Provider)
   - Konfiguration via ENV-Variablen

2. **Schema-Aenderung**
   - `Wine.images` von `Json?` auf strukturiertes Format:
     ```json
     [{"url": "...", "key": "...", "label": "Flasche", "isPrimary": true}]
     ```
   - Oder neue Tabelle `WineImage` mit `wineId` Foreign Key
   - Empfehlung: separate Tabelle, sauberer fuer Relations und Cascading Deletes
   - Migration anlegen

3. **API-Endpoint Bilder**
   - `POST /api/wines/:id/images` — Multipart-Upload, max 5MB pro Bild
   - `DELETE /api/wines/:id/images/:imageId`
   - Validierung: Content-Type, Groesse, max 3 Bilder pro Wein

4. **Web-Anpassung**
   - `src/lib/imageCompression.ts` bleibt — komprimiert vor Upload
   - Upload via FormData statt Base64-JSON
   - Anzeige: URL aus dem Storage statt Base64
   - Migration: einmaliger Job, der bestehende Base64-Bilder hochlaedt und URLs eintraegt

5. **Mobile-Anpassung** (optional in diesem Task, kann separat)
   - Upload statt File-URI
   - Wenn offline: Sync-Queue (siehe Phase 1 Task 5)

6. **Migration der Bestandsdaten**
   - Script `scripts/migrate-images-to-storage.ts`
   - Liest alle Weine, extrahiert Base64, lade hoch, ersetze Eintrag
   - Idempotent, neu startbar
   - Backup der DB vorher dokumentieren

## Akzeptanzkriterien

- [ ] Storage-Provider laeuft (Supabase oder gewaehlt)
- [ ] Upload via API funktioniert
- [ ] Bilder werden korrekt angezeigt (Web)
- [ ] Loeschen entfernt Datei aus Storage
- [ ] Migration der Bestandsdaten erfolgreich
- [ ] Speicherwarnung im Web verschwindet
- [ ] Lint und Typescheck gruen

## Hinweise

- ENV-Variablen in `apps/api/.env.example` ergaenzen
- Coolify-Deployment-Doku in `docs/deploy-coolify.md` aktualisieren
- Diese Aenderung ist **breaking** — sicherstellen dass die Migration vor dem Deploy laeuft
- Mobile-Anpassung kann nachgezogen werden — Backwards-Compat: Mobile liest URLs auch wenn lokale Datei nicht mehr da

## Risiken

- Datenverlust bei fehlerhafter Migration → Backup zwingend
- Kosten bei vielen Bildern → Monitoring ergaenzen
- Auth: Storage-URLs muessen entweder oeffentlich oder via Signed URLs zugaenglich sein
