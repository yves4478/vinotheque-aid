# Plattform-Strategie iOS vs. Web

Dieses Dokument legt fest, wie sich die iOS-App und die Web-App von Vinotheque Aid in Zukunft unterscheiden — und warum. Es ergaenzt die [PWA-first Strategie](./pwa-first-strategy.md) und den [Backlog](./backlog.md).

## Leitprinzip

**Kontext bestimmt Plattform.** Nicht jede Plattform muss alles koennen. iOS und Web bedienen unterschiedliche Nutzungssituationen und sollen je dafuer optimiert werden — nicht auf Feature-Paritaet getrimmt.

| Situation | Plattform | Warum |
|---|---|---|
| Im Keller, beim Einraeumen | iOS | Kamera griffbereit, eine Hand frei |
| An einer Messe oder Degustation | iOS | Schnell, Kamera, offline-faehig |
| "Was trinken wir heute?" | iOS | Schnellentscheid, wenige Taps |
| Wochenplanung, Einkauf | Web | Uebersicht, Filter, mehrere Fenster |
| Keller analysieren oder aufraeumen | Web | Grosse Tabellen, Bulk-Aktionen |
| Merkliste durcharbeiten | Web | Vergleichen, Priorisieren |

## Plattform-Schnitt

### iOS — Erfassen & Entscheiden

**Kernflows:**
- **Wein erfassen** — Label scannen, Felder vorfuellen, speichern. Ziel: unter 60 Sekunden, auch offline.
- **Wein selektieren** — "Was soll ich heute oeffnen?" Filter nach Trinkreife, Typ, Anlass. Schnellentscheid mit Empfehlung.
- **Rating** — Nach dem Oeffnen: Sterne, kurze Notiz, fertig.
- **Degu/Tasting** — An Messen: Foto, Sterne, Event-Kontext.

**Reduzieren oder verstecken:**
- Merkliste-Verwaltung (komplexe Bearbeitung, Priorisierung) — gehoert ins Web
- Einkaufsliste-Verwaltung — auf iOS nur "schnell hinzufuegen", keine Pflege
- Weinhaendler — nur Web
- Rechnungsimport — nur Web
- Weinregionskarte — optional, tief im Menue, nicht in der Tab-Bar
- Statistiken/Dashboard — nur Web

**Neue Features:**
- **Drink-Window-Indikator** auf der Weinkarte: "Jetzt ideal", "Noch 2 Jahre", "Zu frueh"
- **"Heute oeffnen"-Flow**: Wein auswaehlen → Menge buchen → Rating nach dem Trinken
- **Offline-first**: Erfassen ohne Backend, spaetere Sync-Queue
- **Apple Vision Framework** (mittelfristig): on-device, kostenlos, deutlich besser als Tesseract.js

### Web — Verwalten & Planen

**Kernflows:**
- **Keller-Uebersicht** mit Filterung, Sortierung, Bulk-Aktionen
- **Einkaufsliste** mit Priorisierung, Mengen, Haendler-Verknuepfung
- **Merkliste** mit Promotion-Flow in den Keller, Duplikatserkennung
- **Kellerbuch** als Audit-Log
- **Rechnungsimport** via PDF-Upload
- **Dashboard** mit Trinkreife-Analyse, Bestand nach Typ, Jahrgangsprofil
- **Weinhaendler** mit Preisvergleichen
- **Einstellungen** und Konfiguration

**Neue Features:**
- **Trinkreife-Analyse** — welche Weine sind jetzt ideal, welche muessen bald getrunken werden
- **Keller-Wert** basierend auf Kaufpreis
- **Einkaufsplanung** aus Merkliste + Lueckenanalyse
- **CSV-Export** fuer Backup und externe Tools

## Feature-Matrix

| Feature | iOS | Web | Kommentar |
|---|---|---|---|
| Wein erfassen | Hauptflow | Vorhanden | iOS-First |
| Label-Scan / OCR | Hauptflow | Vorhanden | iOS-First, Apple Vision mittelfristig |
| Wein selektieren ("Heute oeffnen") | Hauptflow | Nicht noetig | iOS-only |
| Rating | Hauptflow | Vorhanden | iOS-First |
| Degu/Tasting | Hauptflow | Vorhanden (Nachbearbeitung) | iOS-First, Web fuer Review |
| Keller-Uebersicht | Lesen, Suche | Hauptflow | Web-First |
| Bulk-Aktionen | Nein | Hauptflow | Web-only |
| Einkaufsliste verwalten | Nur hinzufuegen | Hauptflow | Web-First |
| Merkliste verwalten | Nur hinzufuegen | Hauptflow | Web-First |
| Kellerbuch | Optional | Hauptflow | Web-First |
| Rechnungsimport | Nein | Hauptflow | Web-only |
| Weinhaendler | Nein | Hauptflow | Web-only |
| Dashboard / Statistiken | Nein | Hauptflow | Web-only |
| Weinregionskarte | Optional, tief im Menue | Vorhanden | Beide |
| Einstellungen | Basics | Voll | Web-First |
| Drink-Window-Indikator | Hauptflow | Vorhanden | Beide |

## Roadmap

### Phase 1 — iOS schaerfen (4–6 Wochen)

Ziel: Die iOS-App macht den mobilen Kernflow richtig.

1. Tab-Bar auf 4 reduzieren: Keller, Erfassen, Degu, Rating
2. "Heute oeffnen"-Flow implementieren
3. Drink-Window-Badge auf Weinkarte
4. Offline-Erfassung absichern + Sync-Queue
5. Einkaufsliste-Tab auf "Schnell hinzufuegen" reduzieren

### Phase 2 — Web ausbauen (4–6 Wochen)

Ziel: Die Web-App wird das Planungs- und Analyse-Tool.

1. Dashboard mit Trinkreife-Analyse und Keller-Wert
2. Merkliste: Promotion-Flow und Duplikatserkennung verbessern
3. Einkaufsliste: Priorisierung + Haendler-Verknuepfung
4. Keller: Bulk-Aktionen
5. Cloud Storage fuer Bilder (Supabase oder S3) — adressiert technische Schuld 7.1

### Phase 3 — Apple Vision (6–10 Wochen, mittelfristig)

Trigger: Browser-OCR scheitert im Alltag zu oft, oder Claude Vision wird bei mehr als einem Drittel der Scans gebraucht.

1. Apple Vision Framework als Expo Native Module
2. Claude Vision auf echte Fallbacks reduzieren
3. Offline-Sync mit Conflict Resolution

### Phase 4 — Importe (spaeter)

Backlog Features 4 (CSV) und 5 (PDF-Rechnungen). Wichtig fuer Onboarding, nicht kritisch fuer Alltag.

## Offene strategische Entscheidungen

1. **Cloud Storage** — Supabase Storage, AWS S3 oder eigener Server?
2. **Apple Vision Timing** — wann wird Phase 3 ausgeloest?
3. **Mandantenfaehigkeit** — Backlog Feature 6, erst nach Kernflows.
4. **Expo vs. Swift Native** — Apple Vision laesst sich als Expo Native Module einbinden. Swift-Rewrite waere langfristig stabiler, kostet aber Entwicklungszeit.

## Umsetzung mit Agenten

Jeder Roadmap-Schritt wird als eigener Agent-Task spezifiziert. Die Tasks sind in `docs/tasks/` abgelegt und folgen dem Schema der bestehenden `agent-prompt-task-*.md`-Dateien.

**Phase 1 Tasks:** siehe [tasks/phase1-ios/](./tasks/phase1-ios/)
**Phase 2 Tasks:** siehe [tasks/phase2-web/](./tasks/phase2-web/)
