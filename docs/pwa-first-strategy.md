# PWA-first Strategie fuer Vinotheque Aid

## Entscheid

Vinotheque Aid verfolgt kurzfristig und mittelfristig eine `PWA-first`-Strategie mit `Option 2`.

Das bedeutet:

- Die Web-App ist das primaere Produkt.
- Die taegliche Entwicklung findet im Browser statt.
- Die App soll auf Mobilgeraeten installierbar sein und sich wie eine App anfuehlen.
- Die bestehende Expo-App bleibt als Option bestehen, ist aber vorerst nicht der Hauptpfad.
- Lokale Browser-OCR ist der Standard fuer Etikett-Scans.
- Claude Vision ist nur ein manueller Fallback pro Scan.

## Warum dieser Weg

Fuer das aktuelle Produkt sind drei Dinge wichtiger als eine native Huelle:

- Schnelle Iteration bei Formularen, Importen und Erfassungsflows.
- Ein moeglichst einfacher Kamera-Flow fuer Etiketten und Listen.
- Ein wartbarer Codepfad mit wenig Plattform-Sonderfaellen.

Der aktuelle Web-Stack ist bereits produktnah. Fuer eine PWA fehlen vor allem die Plattform-Bausteine wie Manifest, App-Icons, Service Worker und Install-UX. Diese Luecken sind deutlich kleiner als die Kosten einer staerker nativen Produktstrategie.

Fuer das aktuelle Nutzungsprofil passt das:

- Scannen ist wichtig, aber nicht taeglich.
- Die App wird vor allem beim Erfassen und ansonsten mehrere Male pro Woche genutzt.
- Gute Erkennung ist wichtig, aber noch kein Grund fuer zwei getrennte Produktpfade.
- Ein manueller Claude-Fallback pro Einzelfall ist wirtschaftlich vertretbar.

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

### Phase 5 - Strategische Neubewertung

Ziel: Nach echter Nutzung entscheiden, ob PWA alleine reicht.

Messpunkte:

- Wie oft wird die Kamera real genutzt
- Wie gut funktioniert Browser-OCR im Alltag
- Wie haeufig wird der Claude-Vision-Fallback ausgeloest
- Wie oft sind Nutzer an Plattformgrenzen blockiert
- Wie stark waechst lokaler Bildspeicher

Moegliche Ergebnisse:

- PWA bleibt Hauptprodukt
- PWA bleibt Hauptprodukt, Claude-Fallback wird nur selten gebraucht
- Nativer Scanner-Pfad wird ergaenzt, weil OCR und Claude zu oft unzureichend sind
- Vollstaendige native App, wenn PWA-Grenzen den Kernflow blockieren

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

- `Jetzt Option 2`
- `Claude Vision nur manuell pro Scan`
- `Spaeter nur dann Richtung native Scanner-Pfade wechseln, wenn die Re-Evaluate-Trigger real eintreten`
