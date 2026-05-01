# PWA-first Strategie fuer Vinotheque Aid

## Entscheid

Vinotheque Aid verfolgt kurzfristig eine `PWA-first`-Strategie. Mittelfristig ist eine native iOS-App geplant.

Das bedeutet:

- Die Web-App ist das primaere Produkt fuer Entwicklung und taeglichen Betrieb.
- Die App soll auf Mobilgeraeten installierbar sein und sich wie eine App anfuehlen.
- Android-Nutzer koennen dauerhaft die PWA verwenden.
- Fuer iOS ist mittelfristig eine native App der Zielzustand.
- Lokale Browser-OCR ist der Standard fuer Etikett-Scans.
- Claude Vision ist nur ein manueller Fallback pro Scan.

## PWA vs. native iOS — der Unterschied

Diese Gegenuberstellung gilt fuer dieses Projekt konkret:

| Aspekt | PWA (Browser) | Native iOS (Swift / Expo) |
|---|---|---|
| Installation | Ueber Browser, kein App Store | App Store oder TestFlight |
| Updates | Sofort beim naechsten Aufruf | Review-Prozess im App Store |
| Kamera | Ja, via `<input capture>` | Ja, voller Kamera-Zugriff |
| OCR / Bilderkennung | Tesseract.js (schwach) + Claude Vision (API) | Apple Vision Framework (on-device, gratis, stark) |
| Offline | Service Worker, begrenzt | CoreData / SwiftData, robust |
| Performance | Gut fuer Formulare, schwaecher bei Bildverarbeitung | Nativ, deutlich schneller bei Bildern |
| Hintergrundprozesse | Nicht zuverlaessig auf iOS | Vollstaendig unterstuetzt |
| Shortcuts / Widgets | Nicht moeglich | Moeglich |
| Entwicklungsaufwand | Ein Codepfad fuer alle Plattformen | Separater Swift- oder Expo-Codepfad |
| Kosten | Keine App-Store-Gebuehr | 99 USD/Jahr Apple Developer |

**Fazit fuer dieses Projekt:** Die PWA reicht kurzfristig. Der entscheidende Vorteil der nativen iOS-App ist Apple Vision Framework — das loest das OCR-Problem auf dem Geraet, kostenlos und deutlich besser als Tesseract.js.

## Plattformstrategie

Nutzungsprofil:

- Haupt-Device: iPhone
- Android: kein primaeres Geraet, PWA genuegt

Daraus folgt:

- Android: PWA dauerhaft, kein separater nativer Pfad noetig
- iOS: PWA kurzfristig, native App mittelfristig
- Eine React-Native-Expo-App wuerde zwar beide Plattformen abdecken, ist aber nur sinnvoll wenn Android langfristig gleichwertig werden soll

## Warum dieser Weg

Fuer das aktuelle Produkt sind kurzfristig drei Dinge wichtiger als eine native Huelle:

- Schnelle Iteration bei Formularen, Importen und Erfassungsflows.
- Ein moeglichst einfacher Kamera-Flow fuer Etiketten und Listen.
- Ein wartbarer Codepfad mit wenig Plattform-Sonderfaellen.

Der aktuelle Web-Stack ist bereits produktnah. Die PWA-Bausteine (Manifest, App-Icons, Service Worker, Install-UX) sind umgesetzt. Diese Basis traegt die wichtigsten Flows ohne nativen Overhead.

Mittelfristig spricht das Nutzungsprofil klar fuer eine native iOS-App:

- Das primaere Device ist iPhone.
- Die Erkennung ist der Kernflow — und Apple Vision Framework loest OCR on-device, gratis und deutlich staerker als Tesseract.js.
- Wenn Claude Vision oefter als noetig gebraucht wird, ist das ein direktes Signal.

Fuer das aktuelle Nutzungsprofil passt der Zwischenzustand:

- Scannen ist wichtig, aber nicht taeglich.
- Die App wird vor allem beim Erfassen und ansonsten mehrere Male pro Woche genutzt.
- Ein manueller Claude-Fallback pro Einzelfall ist wirtschaftlich vertretbar bis die native App kommt.

## Was PWA-first fuer dieses Repo konkret heisst

### Primaerer Stack

- `src/`: Hauptanwendung fuer Produkt und UI
- `packages/core/`: gemeinsame Domainenlogik
- `apps/api/`: optionale Sync- und Backend-Funktionen

### Vorlaeufig nicht im Fokus

- Neue groessere Produktinvestitionen in `apps/mobile/`
- Native OCR- oder Kamera-Spezialloesungen
- Plattformgetrennte UX fuer Web und Mobile

## Zielbild

Die installierte PWA soll auf iPhone, Android und Desktop folgende Kernflows sauber abdecken:

1. Wein erfassen
2. Weinetikett fotografieren
3. Bilder lokal speichern
4. Basisfelder automatisch vorfuellen
5. Offline weiterarbeiten
6. Spaeter mit Backend synchronisieren

Wichtig: Die PWA muss nicht perfekt "native" wirken. Sie muss die Kernarbeit schnell, robust und stressfrei machen.

## Produktannahmen

### Was die PWA gut loest

- Browserbasierte Entwicklung mit schnellen DevTools
- Installierbarkeit auf Homescreen/Desktop
- Kamera-Zugriff fuer Fotoaufnahme
- Offline-Caching fuer App-Shell und lokale Daten
- Ein gemeinsamer UI- und Produktpfad

### Was die PWA nur teilweise loest

- OCR-Qualitaet bei schwierigen Etiketten
- Sehr tiefe Systemintegration
- Background-Aufgaben mit nativer Zuverlaessigkeit
- Sehr grosse lokale Bildmengen auf iOS/Safari

## Technische Leitlinien

### 1. Installation und App-Gefuehl

Die Web-App wird zu einer echten PWA mit:

- Web App Manifest
- App-Icons fuer Android und iOS
- Service Worker fuer App-Shell-Caching
- Install-Hinweis in der UI
- Standalone-Layout fuer mobile Nutzung

### 2. Kamera und Bildaufnahme

Die PWA nutzt primaer Web-Kamera-Flows:

- Datei-Input mit `accept="image/*"`
- Auf Mobilgeraeten Kamera-orientierter Capture-Flow
- Optional spaeter `getUserMedia()` fuer Live-Vorschau

Die Kamera ist damit kein Grund fuer eine sofort native Produktstrategie.

### 3. Erkennung ohne laufende Kosten als Standard

Die aktuelle Produktentscheidung fuer Erkennung lautet:

- Bild aufnehmen
- OCR lokal im Browser ausfuehren
- Gefundene Texte in Felder wie `name`, `producer`, `vintage` mappen
- Benutzer bestaetigt oder korrigiert
- Nur bei schwachem Ergebnis optional `Mit Claude Vision erneut versuchen`

Die Erkennung ist bewusst ein Assistenz-Flow, kein vollautomatischer Import.

Claude Vision ist ein optionaler, manueller Fallback pro Scan. Es ist keine Standardfunktion und kein langfristiges Ziel fuer einen scan-lastigen Kernflow. Wenn Browser-OCR scheitert, kann der Nutzer einen einzelnen Scan bewusst mit Claude Vision wiederholen. Dieser Schritt gilt nur fuer den aktuellen Scan und erzeugt keine automatischen Folgekosten.

Fuer die konkrete Produkt- und Architekturentscheidung zur Erkennung siehe auch [Erkennungsstrategie](./recognition-strategy.md).

### 4. Offline zuerst denken

Die App soll auch bei schwacher Verbindung nuetzlich bleiben:

- App-Shell offline verfuegbar
- Lokale Wein-Erfassung ohne sofortige Serverabhaengigkeit
- Bilder und Formularstaende lokal zwischenspeichern
- Synchronisation spaeter ergaenzen

### 5. Native nur bei klaren Triggern

Die native App wird erst dann wieder strategisch wichtig, wenn mindestens einer dieser Punkte regelmaessig im Alltag schmerzt:

- Browser-OCR scheitert zu oft fuer den realen Erfassungsflow
- Claude Vision wird bei mehr als ungefaehr einem Drittel der Scans benoetigt
- Kamera-UX im mobilen Browser frustriert real im Einsatz
- Offline/Bildspeicher stossen auf harte Plattformgrenzen
- Gute Erkennung ohne Netz wird produktrelevant
- Es braucht zwingend native Scanner- oder Background-Funktionen

Wenn dieser Punkt erreicht ist, ist der naechste strategische Schritt nicht `mehr Claude`, sondern ein nativer Scanner-Pfad. Das muss nicht sofort eine komplett neue Produktstrategie sein. Die PWA kann Hauptprodukt bleiben, waehrend der Scanner gezielt nativ ergaenzt wird.

- iPhone: `Apple Vision` bzw. Apple Vision Framework
- Android: `Google ML Kit`

Claude Vision ist dann nicht der Endzustand, sondern die Uebergangsloesung bis dahin. Der Grund: Apple Vision und Google ML Kit laufen on-device ohne API-Kosten und mit deutlich besserer Qualitaet als Browser-OCR. Langfristig ist das die sauberere Richtung fuer einen scan-lastigen Kernflow.

## Umsetzungsphasen

### Phase 1 - PWA-Fundament

Ziel: Die Web-App ist installierbar und offline als App-Shell nutzbar.

Umfang:

- PWA-Plugin oder gleichwertige Vite-Konfiguration einrichten
- `manifest.webmanifest` anlegen
- App-Icons bereitstellen
- Service Worker registrieren
- Offline-Fallback und Cache-Strategie definieren
- iOS-Metadaten in `index.html` ergaenzen

Erfolgskriterium:

- Die App laesst sich auf Mobilgeraeten und Desktop installieren.
- Ein Wiederaufruf der zuletzt genutzten App-Shell funktioniert auch bei schlechter Verbindung.

### Phase 2 - Mobile Erfassung in der PWA

Ziel: Wein- und Degu-Erfassung fuehlen sich auf dem Handy schnell und direkt an.

Umfang:

- Kamera-/Mediathek-CTA im Web-UI optimieren
- Bildkomprimierung zentralisieren
- Scanner-Komponente fuer Mobilnutzung vereinfachen
- Formular-Layout fuer Einhand-Nutzung verbessern

Erfolgskriterium:

- Ein Wein kann am iPhone oder Android-Geraet direkt in der PWA fotografiert und erfasst werden.

### Phase 3 - Erkennung als Assistenz

Ziel: Die App spart Tipparbeit, mit lokaler OCR als Standard und Claude Vision nur als manuelle Eskalation.

Umfang:

- Parsing-Logik in `packages/core` extrahieren
- Nur die wahrscheinlichsten Felder vorfuellen
- Benutzer bestaetigt vor dem Speichern
- Claude Vision als manuellen Fallback-Button ergaenzen

Erfolgskriterium:

- Der Scan spart bei einem Teil der Etiketten sinnvoll Tipparbeit.
- Der Standardpfad laeuft ohne API-Kosten.

### Phase 4 - Lokale Robustheit und spaetere Sync

Ziel: Die PWA wird alltagstauglich fuer echte Nutzung.

Umfang:

- IndexedDB-/lokale Speicherstrategie haerten
- Upload-/Sync-Queue vorbereiten
- Speicherwarnungen fuer viele Bilder einbauen
- Fehler- und Wiederaufnahme-UX absichern

Erfolgskriterium:

- Die App verliert keine Erfassungen bei schlechter Verbindung oder Reloads.

### Phase 5 - Native iOS App

Ziel: Apple Vision Framework loest das OCR-Problem on-device, ohne API-Kosten und mit deutlich besserer Qualitaet.

Zeitpunkt: Mittelfristig, sobald die PWA-Phasen 1-4 stabil laufen.

Umfang:

- Expo-App reaktivieren oder neue Swift-App starten
- Apple Vision Framework fuer Etikett-Erkennung einbinden
- Gleiche `packages/core`-Logik wie im Web wiederverwenden
- Claude Vision als Fallback beibehalten, aber seltener noetig

Trigger fuer frueheren Start:

- Claude Vision wird bei mehr als einem Drittel der Scans benoetigt
- OCR-Ergebnisse sind im Alltag zu unbrauchbar fuer sinnvolles Vorfuellen
- Andere PWA-Grenzen blockieren den Kernflow (z.B. Background-Sync, Performance)

## Repo-bezogene Auswirkungen

### Kurzfristig aendern

- [vite.config.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/vite.config.ts)
- [src/main.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/main.tsx)
- [index.html](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/index.html)
- [public](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/public)
- [src/components/WineLabelScanner.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/components/WineLabelScanner.tsx)

### Vorlaeufig nicht priorisieren

- Neue Scanner-Features in [apps/mobile](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/apps/mobile)
- Native OCR-Integration
- Plattformgetrennte Produktlogik

## Risiken

- iOS-PWA-Installation bleibt weniger elegant als im App Store.
- Browser-OCR bleibt schwankender als native Vision/ML-Kit-Loesungen.
- Viele lokale Bilder koennen im Web Speichergrenzen sichtbar machen.
- Service-Worker-Fehler wirken schnell wie "kaputte App" und muessen sauber getestet werden.

## Empfehlung fuer den naechsten Umsetzungsschritt

Als naechstes sollte `Phase 1 - PWA-Fundament` umgesetzt werden.

Der Grund ist einfach:

- Ohne Installierbarkeit wirkt die PWA nicht wie eine echte App.
- Ohne Offline-Basis ist der mobile Nutzen fragil.
- Ohne diese Basis lohnt sich Optimierung der Kamera- und OCR-Flows nur halb.

Danach folgt direkt `Phase 2 - Mobile Erfassung in der PWA`.

Fuer das aktuelle Nutzungsprofil gilt damit:

- `Jetzt: PWA-first, Option 2`
- `Claude Vision nur manuell pro Scan`
- `Android: dauerhaft PWA`
- `iOS: PWA kurzfristig, native App mittelfristig geplant`
- `Native frueher starten, wenn OCR-Qualitaet den Kernflow blockiert`
