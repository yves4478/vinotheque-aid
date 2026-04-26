# Produkt-Backlog und Feature-Beschreibungen

Dieses Dokument beschreibt groessere Produktideen fuer Vinotheque Aid und ihren aktuellen Umsetzungsstand. Die Reihenfolge bildet die aktuelle Roadmap ab: Bilder, Degu und Zusatzinfos zuerst; CSV-Import und Mandantenfaehigkeit spaeter.

## Aktueller Umsetzungsentscheid

Status dieses Branches:

- Mehrere Bilder pro Wein: MVP umgesetzt.
- Wein-Degustation fuer Messen: Web- und Mobile-MVP umgesetzt.
- KI-gestuetzte Zusatzinformationen: MVP umgesetzt als strukturierte Briefing-Ansicht mit Websuch-Link.
- CSV-Upload mit KI-Feldmatching: spaeter.
- Mandantenfaehigkeit: spaeter, weil tiefgreifende Architektur- und Berechtigungsfragen offen sind.

## 1. Mehrere Bilder pro Wein

### Ziel

Zu einem Wein koennen mehrere Bilder gespeichert werden, damit Flasche, Vorderetikett, Ruecketikett oder Messekontext gemeinsam dokumentiert sind.

### Nutzerwert

Ein einzelnes Bild reicht oft nicht aus. Ruecketiketten enthalten wichtige Informationen, Messefotos helfen bei der Erinnerung, und ein Hauptbild sorgt fuer eine gute Darstellung in Listen.

### Umgesetzter MVP

- Pro Wein koennen bis zu 3 Bilder gespeichert werden.
- Bilder koennen beim Erfassen hinzugefuegt werden.
- Bilder koennen in der Keller-Bearbeitung ergaenzt oder entfernt werden.
- Ein Bild kann als Hauptbild markiert werden.
- Web und Mobile zeigen das Hauptbild in Listen/Karten.
- Bestehende Einzelbilder bleiben ueber Legacy-Fallbacks weiterhin sichtbar.

### Naechste Ausbaustufen

- Bildkomprimierung und Speicherlimits final definieren.
- Cloud Storage oder bestehende Medienablage verbindlich festlegen.
- Etikettenerkennung fuer Bilder vorbereiten.

## 2. Wein-Degustation fuer Messen

### Ziel

Die App bietet einen einfachen Degustationsmodus fuer Messen, Lieferantentermine und Veranstaltungen. Benutzer koennen Weine sehr schnell erfassen, bewerten und spaeter nachbearbeiten.

### Nutzerwert

An Messen bleibt wenig Zeit fuer saubere Datenerfassung. Das Feature haelt den Moment fest: Standliste fotografieren, Flasche fotografieren, Sterne vergeben, optional einen kurzen Kommentar notieren. Die Details koennen spaeter aus Bildern, Notizen oder KI-Unterstuetzung ergaenzt werden.

### Umgesetzter MVP

- Neuer Mobile-Tab "Degu".
- Neue Web-Seite "Wein-Degu" unter `/tasting`.
- Kontextfelder fuer Messe/Event, Lieferant und Stand.
- Optionaler Weinname.
- Bis zu 3 Fotos pro Degu-Eintrag.
- Schnelles 1-5 Sterne-Rating.
- Optionaler Kommentar.
- Speicherung als Merkliste-Eintrag mit Quelle `tasting`.

### Naechste Ausbaustufen

- Offline-Flow explizit testen und absichern.
- Degu-Eintraege spaeter in vollstaendige Weinprofile ueberfuehren.
- KI-Erkennung aus Fotos fuer Weinname, Jahrgang und Produzent ergaenzen.

## 3. KI-gestuetzte Zusatzinformationen zum Wein

### Ziel

Wenn ein Benutzer einen Wein auswaehlt, kann er zusaetzliche Informationen abrufen. Die Applikation bereitet vorhandene Weindaten strukturiert auf und fuehrt zur Websuche fuer aktuelle Quellen.

### Nutzerwert

Statt selbst nach Produzent, Region, Rebsorten, Stil, Trinkfenster oder Bewertungen zu suchen, bekommt der Benutzer eine kompakte Uebersicht direkt im Weinprofil.

### Umgesetzter MVP

- Web: Zusatzinfos-Dialog im Keller mit KI-Briefing, Fakten, Food-Pairing und Websuch-Link.
- Mobile: Zusatzinfos im Weindetail mit Kurzbriefing und Websuch-Link.
- Die Suche nutzt vorhandene Weindaten wie Name, Produzent, Jahrgang, Region und Land.
- Kostenintensive echte KI-/Webaufrufe werden noch nicht automatisch ausgefuehrt.

### Naechste Ausbaustufen

- Echte KI-Websuche anbinden.
- Quellen speichern und sichtbar zitieren.
- Unsichere oder widerspruechliche Informationen transparent kennzeichnen.
- Caching und Kostenkontrolle fuer externe Aufrufe umsetzen.

## 4. CSV-Upload mit KI-Feldmatching

### Ziel

Benutzer sollen bestehende Weinlisten als CSV-Datei hochladen koennen. Die Applikation erkennt die enthaltenen Spalten automatisch und matched sie mit den internen Feldern von Vinotheque Aid.

### Nutzerwert

Viele Weinlisten existieren bereits in Excel, CSV-Exporten oder Lieferantenlisten. Der Import reduziert manuelle Erfassung massiv und macht den Einstieg in die Applikation schneller.

### Geplanter Funktionsumfang

- CSV-Datei hochladen.
- Spaltennamen und Beispielwerte auslesen.
- KI-Mapping auf interne Felder vorschlagen.
- Vorschau und manuelle Korrektur vor dem Import.
- Fehlerhafte Zeilen markieren und Importzusammenfassung anzeigen.

### Status

Spaeter umsetzen. Dieses Feature bleibt wichtig fuer Onboarding und Datenmigration, hat aber mehr Validierungs- und Duplikatslogik als die aktuellen Foto-/Degu-Features.

## 5. Mandantenfaehigkeit

### Ziel

Vinotheque Aid soll von mehreren Benutzerinnen und Benutzern sowie mehreren Organisationen genutzt werden koennen, ohne dass Daten versehentlich vermischt oder sichtbar werden.

### Nutzerwert

Haendler, Teams, Event-Organisationen oder mehrere Filialen koennen dieselbe Applikation verwenden und trotzdem getrennte Datenbestaende pflegen.

### Geplanter Funktionsumfang

- Benutzer koennen einem Mandanten zugeordnet werden.
- Weinlisten, Bilder, Bewertungen, Merkerlisten und Importe gehoeren zu einem Mandanten.
- Benutzer sehen standardmaessig nur Daten ihres Mandanten.
- Rollen wie Admin, Bearbeiter und Leser werden geprueft.

### Status

Spaeter umsetzen. Mandantenfaehigkeit greift tief in Datenmodell, Berechtigungen, API und UI ein und sollte erst nach den produktnahen Kernflows geplant werden.
