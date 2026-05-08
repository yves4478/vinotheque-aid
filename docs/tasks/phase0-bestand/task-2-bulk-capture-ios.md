# Task 0.2 — Bulk-Capture Aufnahme-Flow auf iOS

## Auftrag

Baue auf iOS einen Aufnahme-Flow, der mehrere Fotos in einer Session sammelt und sie in eine "Erfassungs-Session" (Capture Session) auf dem Backend schickt. Kein OCR im Client — der Client laedt nur hoch.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Hauptdateien:**
- `apps/mobile/app/capture/index.tsx` (NEU)
- `apps/mobile/app/capture/[sessionId].tsx` (NEU)

**Abhaengigkeit:** Task 0.1 (MinIO Storage) muss laufen. Task 0.3 (Backend) parallel entwickelbar mit Mock.

## Hintergrund

Das Hauptproblem ist Bestand erfassen. Der Aufnahme-Teil muss frictionless sein: Kamera oeffnen, Foto, Kamera oeffnen, Foto, ... Speichern. Keine Felder, keine OCR-Wartezeit, keine Korrektur in der Aufnahme.

## User Flow

1. Nutzer oeffnet "Mehr → Bestand erfassen" oder dedizierten Eintrag im Add-Tab
2. Erstellt neue Capture Session (POST /api/capture-sessions)
3. Sieht eine Galerie mit "+"-Button, der die Kamera oeffnet
4. Macht 1–N Fotos, jedes wird sofort hochgeladen (Hintergrund), Galerie zeigt Status
5. Optional: Loeschen einzelner Fotos
6. Button "Fertig — zur Auswertung" → Session wird auf `submitted` gesetzt
7. Hinweis: "Erkennung laeuft. Review folgt im Web (Link)."

## Konkrete Schritte

### 1. Capture Session anlegen

`POST /api/capture-sessions` (siehe Task 0.3) → erhaelt `{ id, createdAt }`.
Lokal speichern: `AsyncStorage["vinotheque.activeCaptureSession"] = id`.

### 2. Foto-Aufnahme

- Verwende `expo-image-picker` mit `launchCameraAsync({ allowsMultipleSelection: false, quality: 0.8 })`
- Komprimiere Foto via bestehender `imageCompression`-Logik (Ziel: ~1MB max, 1600px lange Kante — etwas hoeher als Standard, weil mehrere Flaschen pro Foto)
- Upload via `POST /api/capture-sessions/:id/photos` (Multipart)
- Antwort: `{ photoId, status: "uploaded" }`

### 3. Galerie-UI

- Grid 2 Spalten, Thumbnails
- Status pro Foto: `uploading | uploaded | failed`
- Tap auf Foto → Vollbild + Loeschen-Option
- Counter: "X Fotos in dieser Session"

### 4. Session abschliessen

- Button "Fertig" → `POST /api/capture-sessions/:id/submit`
- Status der Session wird `submitted` (Backend startet Erkennung, siehe Task 0.3)
- App zeigt: "Erkennung laeuft. Du wirst die Resultate in der Web-App reviewen koennen."
- Link zur Web-Review-URL anbieten (optional kopieren)

### 5. Multiple Sessions

- "Mehr → Bestand erfassen" zeigt Liste vergangener Sessions mit Status
  (`open`, `submitted`, `recognizing`, `ready_for_review`, `completed`)
- Sessions in Status `open` koennen weitergefuehrt werden

## Akzeptanzkriterien

- [ ] Neue Session erstellbar
- [ ] Foto-Aufnahme + Upload in einem Tap
- [ ] Mehrere Fotos pro Session moeglich (10+ getestet)
- [ ] Loeschen einzelner Fotos funktioniert
- [ ] Submit setzt Session auf naechsten Status
- [ ] Lint und Typescheck gruen

## Hinweise

- KEINE OCR oder Erkennung im Client — das macht das Backend
- Upload kann fehlschlagen (Verbindung) — failed-Status anzeigen, manuelles Retry
- `expo-image-picker` ist vermutlich schon installiert (bestehender AddWine-Flow)
- Bilder NICHT in `Wine.images` ablegen — sie gehoeren zu `CaptureSession`/`CapturePhoto`, nicht zu einem Wein
