# Task 0.3 — Backend Claude Vision Batch-Erkennung

## Auftrag

Baue das Backend fuer Capture Sessions: Foto-Upload, Claude-Vision-Erkennung pro Foto, strukturiertes Ergebnis. Keine UI in diesem Task.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `apps/api/prisma/schema.prisma` (Schema)
- `apps/api/src/routes/captureSessions.ts` (NEU)
- `apps/api/src/recognition/claudeVision.ts` (NEU oder Erweiterung)

**Abhaengigkeit:** Task 0.1 (MinIO Storage).

## Schema

```prisma
model CaptureSession {
  id         String   @id @default(cuid())
  status     String   // open | submitted | recognizing | ready_for_review | completed
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  photos     CapturePhoto[]
  candidates RecognizedCandidate[]
  costCents  Int      @default(0)
}

model CapturePhoto {
  id            String   @id @default(cuid())
  sessionId     String
  session       CaptureSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  storageKey    String
  url           String
  width         Int?
  height        Int?
  bytes         Int?
  status        String   // uploaded | recognized | failed
  recognitionError String?
  createdAt     DateTime @default(now())
  candidates    RecognizedCandidate[]

  @@index([sessionId])
}

model RecognizedCandidate {
  id          String   @id @default(cuid())
  sessionId   String
  session     CaptureSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  photoId     String
  photo       CapturePhoto @relation(fields: [photoId], references: [id], onDelete: Cascade)
  name        String?
  producer    String?
  vintage     Int?
  region      String?
  country     String?
  type        String?
  confidence  Float?
  rawJson     Json
  status      String   // pending | accepted | rejected | merged
  linkedWineId String?
  bbox        Json?    // {x, y, w, h} relative 0-1
  createdAt   DateTime @default(now())

  @@index([sessionId])
  @@index([photoId])
}
```

Migration: `prisma migrate dev --name add_capture_sessions`.

## API-Endpoints

| Method | Pfad | Zweck |
|---|---|---|
| POST | `/api/capture-sessions` | Neue Session, Status `open` |
| GET | `/api/capture-sessions` | Liste aller Sessions |
| GET | `/api/capture-sessions/:id` | Details inkl. Photos und Candidates |
| POST | `/api/capture-sessions/:id/photos` | Multipart-Upload, ein Foto pro Request |
| DELETE | `/api/capture-sessions/:id/photos/:photoId` | Foto loeschen |
| POST | `/api/capture-sessions/:id/submit` | Status `submitted`, triggert Erkennung |
| POST | `/api/capture-sessions/:id/candidates/:cId/accept` | Candidate akzeptieren — Wein anlegen |
| POST | `/api/capture-sessions/:id/candidates/:cId/reject` | Candidate verwerfen |
| PUT | `/api/capture-sessions/:id/candidates/:cId` | Candidate-Felder korrigieren |

## Recognition Worker

Bei `submit`:
1. Status auf `recognizing` setzen
2. Pro Foto: Claude Vision Aufruf mit Prompt "Identifiziere alle erkennbaren Weinflaschen in diesem Bild. Pro Flasche: name, producer, vintage, region, country, type. Liefere JSON-Liste."
3. Antworten parsen, pro Flasche `RecognizedCandidate` anlegen mit `status: pending`
4. Photo-Status auf `recognized` oder `failed`
5. Kosten tracken (`costCents` in Session)
6. Wenn alle Photos verarbeitet: Session auf `ready_for_review`

**Async-Strategie:**
- Synchron im Endpoint waere zu lang (Claude Vision braucht 5–15 Sek pro Foto)
- Einfachster Weg: in-process Queue (Promise-Chain), kein zusaetzlicher Worker noetig
- Sessionstatus laesst Frontend pollen oder via SSE/WS notifizieren — fuer den Anfang Polling
- Bei Fehler einzelner Photos: Rest weiter, Photo auf `failed`

## Claude Vision Prompt (Vorschlag)

```
Du analysierst ein Foto eines Weinregals oder einer Weinsammlung.
Identifiziere alle Flaschen, deren Etikett du lesen kannst.
Antworte ausschliesslich als JSON-Array mit Objekten:
{
  "name": "...",
  "producer": "...",
  "vintage": 2018,
  "region": "...",
  "country": "...",
  "type": "rot|weiss|rose|schaumwein|dessert",
  "confidence": 0.0-1.0,
  "bbox": {"x": 0.0-1.0, "y": 0.0-1.0, "w": 0.0-1.0, "h": 0.0-1.0}
}
Felder, die du nicht sicher erkennen kannst, lasse weg.
Keine Erklaerungen, nur JSON.
```

Modell: `claude-opus-4-7` oder `claude-sonnet-4-6` fuer bessere Kosten-Performance — empfohlen `claude-sonnet-4-6`.

## Akzeptanzkriterien

- [ ] Schema-Migration sauber
- [ ] Alle Endpoints mit curl getestet
- [ ] Foto-Upload landet in MinIO
- [ ] Erkennung produziert Candidates pro Foto
- [ ] Fehler in einzelnen Photos brechen die Session nicht ab
- [ ] Kosten werden getrackt
- [ ] Lint und Typescheck gruen

## Hinweise

- Bestehender Claude-Vision-Code in `packages/core/src/lib/claudeVision.ts` als Referenz
- Server muss Claude API Key haben — ENV `ANTHROPIC_API_KEY`
- Rate Limit: max 5 parallele Photo-Aufrufe pro Session (sonst Anthropic-Limits)
- Logs pro Erkennung: Token-Verbrauch, Latenz
