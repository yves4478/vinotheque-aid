# Task 0.5 — Bulk-Save in den Keller

## Auftrag

Baue den finalen Schritt der Capture Session: alle akzeptierten Candidates landen als echte Weine im Keller, mit korrekten Mengen und Verknuepfung zum Original-Foto.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `apps/api/src/routes/captureSessions.ts` (Erweiterung)
- `src/pages/CaptureReview.tsx` (Integration)

**Abhaengigkeit:** Task 0.4.

## Konkrete Schritte

### 1. API-Endpoint

`POST /api/capture-sessions/:id/finalize`

Body:
```json
{
  "candidates": [
    {
      "candidateId": "...",
      "action": "create" | "addToExisting",
      "wineId": "...",            // nur bei addToExisting
      "quantity": 1,
      "overrideFields": { ... }   // nur bei create, finale Werte
    }
  ]
}
```

Logik:
- Pro Candidate mit `action: create`:
  - Neuen `Wine` anlegen mit `overrideFields`
  - Original-Foto als `WineImage` mit `label = "Erfassung"` verlinken
  - `CellarMovement` (in) anlegen mit `quantity`
  - Candidate auf `accepted` + `linkedWineId` setzen
- Pro Candidate mit `action: addToExisting`:
  - `Wine.quantity += quantity`
  - `CellarMovement` (in) anlegen
  - Candidate auf `merged` + `linkedWineId` setzen
- Verworfene Candidates: bleiben als `rejected` archiviert
- Session-Status auf `completed`

Transaktional: Prisma `$transaction`. Bei Fehler: nichts speichern.

### 2. Foto-Verknuepfung

Wenn ein Candidate akzeptiert wird, wird das `CapturePhoto`, aus dem er stammt, als Image am neuen Wein angehaengt — als Read-Only-Referenz auf den Storage-Key (kein Re-Upload). Mehrere Candidates aus demselben Foto verlinken alle auf dasselbe Bild.

### 3. UI-Integration

In `CaptureReview.tsx`:
- Footer-Button "Speichern (X Eintraege)" wird aktiv sobald >= 1 Candidate akzeptiert
- Klick → Bestaetigungs-Dialog: "X neue Weine, Y Mengen-Erhoehungen, Z verworfen"
- Bei Bestaetigung: API-Call, Loading-State, Success-Toast mit Link zum Keller

### 4. Mengen-Eingabe

- Pro akzeptiertem Candidate Default `quantity: 1`
- In der Card editierbar (Number-Input)
- Anwendungsfall: 6 Flaschen vom selben Wein im Foto → einmal akzeptieren mit `quantity: 6`, andere mit `addToExisting` mergen

### 5. Nach Finalize

- Session bleibt sichtbar (Read-Only) mit Status `completed`
- Anzeige: "X Weine erstellt, Y Mengen erhoeht"
- Photos und Candidates bleiben fuer Audit erhalten

## Akzeptanzkriterien

- [ ] Finalize legt Weine korrekt an
- [ ] Mengen-Erhoehungen funktionieren
- [ ] CellarMovements werden geschrieben
- [ ] Foto-Verknuepfung sichtbar im Wein-Detail
- [ ] Transaktion: bei Fehler nichts gespeichert
- [ ] Session-Status korrekt auf `completed`
- [ ] Lint und Typescheck gruen

## Hinweise

- Bei vielen Candidates (>50): Progress-Indikator, ggf. Server-Side-Streaming
- Idempotenz: zweiter `finalize`-Call auf bereits completed Session → 409
- Fehler-Reporting: pro Candidate, falls einer scheitert (z.B. wineId nicht gefunden bei addToExisting), aber Transaktion schlaegt komplett fehl — alternativ: einzelne Failures sammeln und am Ende reporten
