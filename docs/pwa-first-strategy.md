# PWA-first Strategie fuer Vinotheque Aid

## Entscheid

Vinotheque Aid verfolgt kurzfristig und mittelfristig eine PWA-first-Strategie.

Das bedeutet:

- Die Web-App ist das primaere Produkt.
- Die taegliche Entwicklung findet im Browser statt.
- Die App soll auf Mobilgeraeten installierbar sein und sich wie eine App anfuehlen.
- Die bestehende Expo-App bleibt als Option bestehen, ist aber vorerst nicht der Hauptpfad.

## Warum dieser Weg

Fuer das aktuelle Produkt sind drei Dinge wichtiger als eine native Huelle:

- Schnelle Iteration bei Formularen, Importen und Erfassungsflows.
- Ein moeglichst einfacher Kamera-Flow fuer Etiketten und Listen.
- Ein wartbarer Codepfad mit wenig Plattform-Sonderfaellen.

Der aktuelle Web-Stack ist bereits produktnah. Fuer eine PWA fehlen vor allem die
Plattform-Bausteine wie Manifest, App-Icons, Service Worker und Install-UX. Diese
Luecken sind deutlich kleiner als die Kosten einer staerker nativen Produktstrategie.

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

Wichtig: Die PWA muss nicht perfekt "native" wirken. Sie muss die Kernarbeit schnell,
robust und stressfrei machen.

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

Die kostenlose MVP-Strategie fuer Erkennung lautet:

- Bild aufnehmen
- OCR lokal im Browser ausfuehren
- Gefundene Texte in Felder wie `name`, `producer`, `vintage` mappen
- Benutzer bestaetigt oder korrigiert

Die Erkennung ist bewusst ein Assistenz-Flow, kein vollautomatischer Import.

Claude Vision ist ein optionaler, manueller Fallback pro Scan — keine Standardfunktion
und kein langfristiges Ziel fuer einen scan-lastigen Kernflow. Wenn Browser-OCR scheitert,
kann der Nutzer einen einzelnen Scan bewusst mit Claude Vision wiederholen. Dieser Schritt
gilt nur fuer den aktuellen Scan und erzeugt keine automatischen Folgekosten.

Fuer die konkrete Produkt- und Architekturentscheidung zur Erkennung siehe auch
[Erkennungsstrategie](./recognition-strategy.md).

### 4. Offline zuerst denken

Die App soll auch bei schwacher Verbindung nuetzlich bleiben:

- App-Shell offline verfuegbar
- Lokale Wein-Erfassung ohne sofortige Serverabhaengigkeit
- Bilder und Formularstaende lokal zwischenspeichern
- Synchronisation spaeter ergaenzen

### 5. Native nur bei klaren Triggern

Die native App wird erst dann wieder strategisch wichtig, wenn mindestens einer dieser
Punkte regelmaessig im Alltag schmerzt:

- Browser-OCR scheitert zu oft fuer den taeglichen Erfassungsflow
- Claude Vision wird zu haeufig als Fallback benoetigt
- Kamera-UX im mobilen Browser frustriert real im Einsatz
- Offline/Bildspeicher stossen auf harte Plattformgrenzen
- Es braucht zwingend native Scanner- oder Background-Funktionen

Wenn dieser Punkt erreicht ist, ist der naechste strategische Schritt ein nativer
Scanner-Pfad — nicht zwingend eine vollstaendige native App:

- iPhone: Apple Vision Framework (on-device, kostenlos, sehr gute Qualitaet)
- Android: Google ML Kit (on-device, kostenlos, sehr gute Qualitaet)

Claude Vision ist dann nicht der Endzustand, sondern die Uebergangsloesung bis dahin.
Der Grund: Apple Vision und Google ML Kit laufen on-device ohne API-Kosten und mit
deutlich besserer Qualitaet als Browser-OCR. Langfristig ist das die sauberere Richtung
fuer einen scan-lastigen Kernflow.

## Umsetzungsphasen

### Phase 1 — PWA-Fundament

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

### Phase 2 — Mobile Erfassung in der PWA

Ziel: Wein- und Degu-Erfassung fuehlen sich auf dem Handy schnell und direkt an.

Umfang:

- Kamera-/Mediathek-CTA im Web-UI optimieren
- Bildkomprimierung zentralisieren
- Scanner-Komponente fuer Mobilnutzung vereinfachen
- Formular-Layout fuer Einhand-Nutzung verbessern

Erfolgskriterium:

- Ein Wein kann am iPhone oder Android-Geraet direkt in der PWA fotografiert und erfasst werden.

### Phase 3 — Erkennung als Assistenz

Ziel: Die App spart Tipparbeit, ohne externe API-Kosten im Standardpfad zu erzeugen.

Umfang:

- Parsing-Logik in `packages/core` extrahieren
- Nur die wahrscheinlichsten Felder vorfuellen
- Benutzer bestaetigt vor dem Speichern
- Claude Vision als manuellen Fallback-Button ergaenzen

Erfolgskriterium:

- Der Scan spart bei einem Teil der Etiketten sinnvoll Tipparbeit.
- Der Standardpfad laeuft ohne API-Kosten.

### Phase 4 — Lokale Robustheit und spaetere Sync

Ziel: Die PWA wird alltagstauglich fuer echte Nutzung.

Umfang:

- IndexedDB-/lokale Speicherstrategie haerten
- Upload-/Sync-Queue vorbereiten
- Speicherwarnungen fuer viele Bilder einbauen
- Fehler- und Wiederaufnahme-UX absichern

Erfolgskriterium:

- Die App verliert keine Erfassungen bei schlechter Verbindung oder Reloads.

### Phase 5 — Strategische Neubewertung

Ziel: Nach echter Nutzung entscheiden, ob PWA alleine reicht.

Messpunkte:

- Wie oft wird die Kamera real genutzt
- Wie gut funktioniert Browser-OCR im Alltag
- Wie haeufig wird der Claude-Vision-Fallback ausgeloest
- Wie oft sind Nutzer an Plattformgrenzen blockiert

Moegliche Ergebnisse:

- PWA bleibt Hauptprodukt, kein Handlungsbedarf
- PWA bleibt Hauptprodukt, Claude-Fallback wird reduziert weil OCR gut genug ist
- Nativer Scanner-Pfad wird ergaenzt (Apple Vision / ML Kit), weil OCR und Claude zu oft unzureichend sind
- Vollstaendige native App, wenn PWA-Grenzen den Kernflow blockieren

## Risiken

- iOS-PWA-Installation bleibt weniger elegant als im App Store.
- Browser-OCR bleibt schwankender als native Vision/ML-Kit-Loesungen.
- Viele lokale Bilder koennen im Web Speichergrenzen sichtbar machen.
- Service-Worker-Fehler wirken schnell wie "kaputte App" und muessen sauber getestet werden.
