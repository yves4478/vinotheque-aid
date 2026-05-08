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

### Phase 0 — Bestand erfassen (3–4 Wochen, ZUERST)

Ziel: Den bestehenden physischen Keller in die App bringen. Das ist das aktuelle Hauptproblem und blockiert alle anderen Mehrwerte.

**Ansatz: Bulk-Capture statt Bottle-by-Bottle.** Der Nutzer fotografiert Regalfaecher mit dem iPhone, Claude Vision identifiziert mehrere Flaschen pro Foto im Backend, der Nutzer reviewt und korrigiert das Ergebnis am Web.

1. MinIO Cloud Storage in Coolify aufsetzen + API-Anbindung
2. Bulk-Capture-Flow am iPhone (Multi-Foto-Auswahl, Upload)
3. Backend-Batch-Erkennung mit Claude Vision (mehrere Flaschen pro Foto)
4. Review-UI im Web (Liste, Korrektur, Bulk-Save)
5. Manuelle Erfassung als Fallback

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

### Phase 3 — Apple Vision (optional, nur bei Bedarf)

**Status: zurueckgestellt.** Nach Phase 0 ist der Bestand erfasst. Neue Flaschen kommen nur durch Einkauf oder Geschenke — der bestehende Single-Bottle-Scan-Flow mit Tesseract.js und Claude Vision als Fallback reicht dafuer.

Apple Vision Framework wird erst dann ein Thema, wenn:
- Regelmaessige Scans im Alltag wieder ein haeufiger Flow werden
- Claude Vision Kosten relevant werden
- Browser-OCR im Alltag zu oft scheitert

Umsetzung waere dann als Expo Native Module (nicht Swift-Rewrite, siehe `platform-strategy.md` Diskussion).

### Phase 4 — Importe (spaeter)

Backlog Feature 4 (CSV) und 5 (PDF-Rechnungen). Wichtig fuer Onboarding neuer Nutzer (Mandantenfaehigkeit), nicht kritisch fuer den primaeren Alltag.

## Strategische Entscheidungen (getroffen)

1. **Cloud Storage: MinIO auf eigenem Coolify-Server.** S3-kompatibel, kein Vendor-Lock, Daten bleiben auf eigener Hardware. Spaeterer Wechsel zu AWS S3 ohne Code-Aenderung moeglich.
2. **Bestand-Onboarding: Bulk-Capture mit Claude Vision** statt Single-Bottle-Scan. Aufwaende ~30 Min Foto + 1–2 Std Review fuer ~300 Flaschen, gegenueber 3–5 Std Single-Scan.
3. **iOS-Stack: Expo bleibt.** Apple Vision waere als Native Module einbindbar — wird aber nicht priorisiert, weil Phase 0 das Onboarding-Problem anders loest.
4. **Mandantenfaehigkeit: Backlog Feature 6, spaeter.**

## Umsetzung mit Agenten

Jeder Roadmap-Schritt wird als eigener Agent-Task spezifiziert. Die Tasks sind in `docs/tasks/` abgelegt und folgen dem Schema der bestehenden `agent-prompt-task-*.md`-Dateien.

**Phase 0 Tasks:** siehe [tasks/phase0-bestand/](./tasks/phase0-bestand/) — **HIER STARTEN**
**Phase 1 Tasks:** siehe [tasks/phase1-ios/](./tasks/phase1-ios/)
**Phase 2 Tasks:** siehe [tasks/phase2-web/](./tasks/phase2-web/)
