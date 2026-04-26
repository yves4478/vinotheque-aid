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

## 5. PDF-Import fuer Lieferantenrechnungen und Lieferscheine

### Ziel

Benutzer koennen Rechnungen oder Lieferscheine von Weinlieferanten als PDF hochladen. Die Applikation liest die enthaltenen Weinpositionen aus, zeigt sie strukturiert an und fragt, welche davon in den Keller aufgenommen werden sollen.

### Nutzerwert

Nach einem Einkauf oder einer Lieferung entfaellt das manuelle Abtippen. Der Benutzer laedt einfach die Rechnung oder den Lieferschein hoch, prueft die erkannten Positionen und bestaetigt den Import mit einem Klick. Fehlende Angaben koennen direkt korrigiert werden.

### Geplanter Funktionsumfang

- PDF-Upload via Drag-and-drop oder Dateiauswahl (Web und Mobile).
- Textextraktion aus dem PDF (pdfjs oder KI-Vision bei schlechter Textqualitaet/Scans).
- KI-Parsing der Positionen: Weinname, Produzent, Jahrgang, Menge, Preis pro Flasche, Lieferant.
- Uebersichtstabelle der erkannten Weine mit Checkbox pro Position.
- Manuelle Korrektur einzelner Felder vor dem Import.
- Duplikatserkennung: Abgleich mit bestehenden Kellereintraegen.
- Direktimport der bestaetigten Positionen als neue Kellereintraege.
- Optionale Speicherung des Original-PDFs am Weineintrag.
- Importprotokoll: wieviele Positionen erkannt, importiert, uebersprungen.

### Offene Fragen

- KI-Provider fuer Parsing: Claude Vision API, OpenAI oder reines pdfjs?
- Kostenkontrolle bei vielen grossen PDF-Scans (OCR ist teuer).
- Umgang mit Rechnungsformaten verschiedener Lieferanten (grosse Formatvariation).
- Soll das Original-PDF gespeichert werden und wenn ja wo (Cloud Storage)?

### Status

Spaeter umsetzen. Abhaengig von KI-Websuche-Anbindung (Feature 3) und Cloud Storage (Technische Schuld 6.1). Empfehlung: nach CSV-Import (Feature 4) angehen, da aehnliche Importlogik wiederverwendet werden kann.

## 6. Mandantenfaehigkeit

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

## 7. Technische Schulden aus dem MVP

Diese Punkte stammen aus dem Code Review der MVP-Umsetzungen und sind keine Produkt-Features, sondern architektonische Aufgaben. Sie blockieren die aktuelle Funktionalitaet nicht, sollten aber vor breiterem Rollout adressiert werden.

### 6.1 Bildspeicher-Strategie ueber Base64 hinaus

Heute werden Bilder im Web als Base64 in IndexedDB und auf Mobile als File-URIs im `FileSystem.documentDirectory` gespeichert. Bei 3 Bildern pro Wein und vielen Weinen wird das Speicher-Quota auf dem Web schnell knapp; auf Mobile waechst der lokale Speicherbedarf unbegrenzt.

Aufgabe:
- Cloud Storage anbinden (z. B. Supabase Storage, S3 oder vorhandene Medienablage).
- Migrationspfad fuer bestehende lokale Bilder definieren.
- Quota-Warnung im Web ergaenzen, solange Cloud Storage noch nicht aktiv ist.

### 6.2 Konsistente Bildkomprimierung

Heute komprimiert `AddWine.tsx` auf 800px / 72 % Qualitaet, `Cellar.tsx` jedoch auf 600px / 70 %. Die Logik ist jeweils inline.

Aufgabe:
- Eine zentrale `compressImage(file, options)` in `@vinotheque/core` oder `src/lib/imageCompression.ts` extrahieren.
- Konstanten fuer maximale Dimension, Qualitaet und Dateigroesse definieren.
- Web und Mobile auf die gemeinsame Funktion umstellen.

### 6.3 Datenbank-Constraints fuer `images`

Die Felder `images Json?` auf `Wine` und `WishlistItem` sind unbeschraenkt. Die App-Logik begrenzt auf 3 Bilder, aber die Datenbank tut das nicht.

Aufgabe:
- Migration hinzufuegen, die per `CHECK`-Constraint die Anzahl Bilder pro Eintrag und die Gesamtgroesse limitiert.
- Eingabe-Validierung in den API-Routen (`apps/api/src/routes/wines.ts`, `wishlist.ts`) ergaenzen.

### 6.4 Tasting-Felder bei Promotion zu Wein

Wenn ein Degu-Eintrag spaeter zu einem vollstaendigen Wein-Eintrag wird (siehe 2 - Naechste Ausbaustufen), gehen `tastingEvent`, `tastingSupplier` und `tastingStand` heute verloren, weil das `Wine`-Modell diese Felder nicht hat.

Aufgabe:
- Entscheidung: gehoeren Tasting-Kontextfelder auf das `Wine`-Modell oder bleiben sie ausschliesslich auf `WishlistItem`?
- Falls ja, Migration erweitern und UI ergaenzen.
- Falls nein, beim Promotion-Flow eine Notiz mit dem Tasting-Kontext erzeugen.

### Status

Laufend, kann inkrementell abgearbeitet werden. Reihenfolge der Empfehlung: 6.2 (klein, sofort), 6.3 (klein, sofort), 6.1 (groesser, mittel), 6.4 (an Promotion-Feature gekoppelt).
