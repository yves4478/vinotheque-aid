# Erkennungsstrategie fuer Vinotheque Aid

## Entscheid

Vinotheque Aid verfolgt fuer Bilderkennung kurzfristig eine `kostenlose, browserbasierte Assistenz-Strategie`.

Das bedeutet:

- Standardpfad ist `Foto -> OCR -> Feldvorschlaege -> manuelle Bestaetigung`.
- Die Erkennung laeuft ohne laufende API-Kosten.
- Die Erkennung speichert nie automatisch.
- Claude Vision ist nur ein spaeterer, optionaler Fallback und nicht der Default.
- Wenn Claude Vision spaeter aktiviert wird, dann nur `pro Scan` durch eine bewusste Benutzeraktion.

## Warum dieser Weg

Im aktuellen Produkt ist die groesste Chance nicht Vollautomatisierung, sondern weniger Tipparbeit bei moeglichst wenig Komplexitaet.

Die Strategie passt zu den bereits vorhandenen Bausteinen:

- In [src/components/WineLabelScanner.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/components/WineLabelScanner.tsx) existiert bereits Browser-OCR mit `tesseract.js`.
- In [src/pages/AddWine.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/AddWine.tsx) gibt es bereits einen Scan-Einstieg fuer das Erfassen.
- In [src/pages/Tasting.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/Tasting.tsx) existiert ein schneller Degu-Flow, der spaeter von Erkennung profitieren kann.
- In [src/lib/invoiceParse.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/lib/invoiceParse.ts) existiert bereits ein separater KI-Pfad fuer Rechnungen, der aber nicht auf den Etiketten-Flow uebertragen werden soll.

## Problem heute

Der aktuelle Web-Scanner funktioniert technisch, ist aber strategisch noch zu flach:

- OCR und Parsing sitzen gemeinsam in der UI-Komponente.
- Die Heuristik beschraenkt sich praktisch auf `Produzent`, `Name` und `Jahrgang`.
- Die Erkennung ist nur fuer den Web-Add-Wine-Flow gedacht.
- Es gibt keine klaren Confidence-Regeln.
- Es gibt keine gemeinsame, wiederverwendbare Erkennungslogik in `packages/core`.

## Zielbild

Die Erkennung soll als Assistenzsystem funktionieren:

1. Der Benutzer fotografiert Etikett, Ruecketikett oder Liste.
2. Die App liest moeglichst viel lokal aus dem Bild.
3. Die App schlaegt nur die Felder vor, die mit vertretbarer Sicherheit erkannt wurden.
4. Der Benutzer uebernimmt, korrigiert oder verwirft den Vorschlag.
5. Erst danach wird gespeichert.

Wichtig: Erfolg bedeutet nicht "perfekte automatische Weinerkennung", sondern `spuerbar weniger manuelle Eingabe`.

## Leitprinzipien

### 1. OCR ist nur ein Zwischenschritt

OCR allein erkennt Text, aber noch keinen Wein.

Die Produktlogik muss daher immer aus zwei Schritten bestehen:

- `Text aus Bild holen`
- `Text in Weinfelder uebersetzen`

### 2. Nur Assistenz, keine Automatik

Die App darf durch Erkennung nie still falsche Datensaetze erzeugen.

Darum gilt:

- keine Auto-Saves
- keine stillen Ueberschreibungen
- nur bewusste Uebernahme durch den Benutzer

### 3. Kostenfrei zuerst, teuer spaeter optional

Der Standardweg bleibt lokal und kostenlos.

Claude Vision oder aehnliche externe KI ist nur dann sinnvoll, wenn echte Nutzung zeigt, dass:

- Browser-OCR zu oft unbrauchbar ist
- Etiketten sehr heterogen sind
- der Produktwert die laufenden Kosten rechtfertigt

### 4. Gemeinsame Logik in `packages/core`

Erkennung soll kein UI-Sondercode bleiben.

Die Interpretations- und Normalisierungslogik gehoert in wiederverwendbare Funktionen, damit spaeter mehrere Einstiege denselben Kern nutzen koennen.

## Erkennungsumfang

### Phase A - Etikett-Assistenz fuer Wein erfassen

Erkannte Felder im MVP:

- `producer`
- `name`
- `vintage`

Moegliche spaetere Felder:

- `region`
- `country`
- `type`
- `grape`

Diese Phase ist der wichtigste erste Schritt, weil sie direkt in den Kernflow `Wein erfassen` einzahlt.

### Phase B - Erkennung fuer Degu-Flow

Moegliche Inputs:

- Flaschenfoto
- Etikett
- Standliste
- Ruecketikett

Nutzen:

- schneller Vorfuellwert fuer Weinname
- spaeter moeglicher Vorschlag fuer Produzent
- weniger manuelle Eingabe waehrend Messen

### Phase C - Dokumente und Listen

Anwendungsfaelle:

- Lieferantenlisten
- Preislisten
- Rechnungen
- Lieferscheine

Wichtig:

Dieser Bereich ist absichtlich getrennt vom Etiketten-Flow.
Fuer strukturierte Dokumente kann ein spaeterer KI-Pfad weiterhin sinnvoll sein, ohne dass der Standard-Scanner teuer wird.

## Zielarchitektur

Die Erkennung soll in vier Schichten organisiert werden.

### 1. Capture

Verantwortung:

- Bild aufnehmen oder auswaehlen
- Bild komprimieren
- Bild lokal vorverarbeiten

Typische Orte:

- [src/components/WineLabelScanner.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/components/WineLabelScanner.tsx)
- [src/pages/AddWine.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/AddWine.tsx)
- spaeter [src/pages/Tasting.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/Tasting.tsx)

### 2. OCR

Verantwortung:

- Text lokal aus dem Bild extrahieren
- Rohtext plus optional Strukturinformationen liefern

Standardtechnologie:

- `tesseract.js` im Browser

### 3. Interpretation

Verantwortung:

- irrelevante Textzeilen entfernen
- Jahrgang, Produzent und Weinname heuristisch ableiten
- spaeter weitere Felder vorschlagen
- Confidence pro Feld bestimmen

Diese Logik gehoert in `packages/core`.

### 4. Review

Verantwortung:

- Vorschlaege anzeigen
- Benutzer uebernimmt oder verwirft
- nur bestaetigte Werte ins Formular schreiben

## Empfohlene Datenform

Die Erkennung sollte mittelfristig nicht nur `Partial<ScanResult>` liefern, sondern einen reicheren Vorschlag.

Beispielhafte Zielstruktur:

```ts
type RecognizedWineDraft = {
  rawText: string;
  fields: {
    producer?: { value: string; confidence: "high" | "medium" | "low" };
    name?: { value: string; confidence: "high" | "medium" | "low" };
    vintage?: { value: number; confidence: "high" | "medium" | "low" };
    region?: { value: string; confidence: "low" | "medium" | "high" };
    country?: { value: string; confidence: "low" | "medium" | "high" };
    type?: { value: "rot" | "weiss" | "rosé" | "schaumwein" | "dessert"; confidence: "low" | "medium" | "high" };
    grape?: { value: string; confidence: "low" | "medium" | "high" };
  };
  warnings: string[];
};
```

Das ist noch kein Implementierungszwang, aber die strategische Richtung.

## Confidence-Regeln

Die App soll konservativ vorgehen.

### Hoch

- vierstelliger Jahrgang klar erkannt
- Produzent/Name aus starken Zeilenpositionen oder bekannten Mustern

Verhalten:

- Feld darf prominent vorgeschlagen werden

### Mittel

- plausibler Kandidat, aber nicht eindeutig

Verhalten:

- Feld nur als Vorschlag markieren

### Tief

- unsicher, verrauscht oder mehrdeutig

Verhalten:

- nicht automatisch ins Formular schreiben
- optional in "weitere Hinweise" anzeigen

## Null-Kosten-Roadmap

### Schritt 1 - Parsing aus der UI loesen

Ziel:

- `parseWineLabel` aus [src/components/WineLabelScanner.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/components/WineLabelScanner.tsx) in `packages/core` verschieben

Nutzen:

- gemeinsame Logik
- testbarer Kern
- spaeter nutzbar fuer weitere Scanner-Einstiege

### Schritt 2 - Erkennung konservativer machen

Ziel:

- nur sichere Felder automatisch vorfuellen
- Rohtext und Warnungen sichtbar machen

Nutzen:

- weniger stille Fehlbefuellungen

### Schritt 3 - Bildvorverarbeitung verbessern

Ziel:

- zentrale Bildkomprimierung
- Ausrichtung, Groesse und Kontrast fuer OCR verbessern

Nutzen:

- bessere OCR, ohne externe Kosten

### Schritt 4 - Degu-Flow anbinden

Ziel:

- Erkennung nicht nur beim Keller-Formular, sondern auch im Degu-Kontext verfuembar machen

Nutzen:

- derselbe Kern bedient mehrere Nutzerfluesse

### Schritt 5 - Erst danach ueber Fallbacks entscheiden

Moegliche spaetere Fallbacks:

- Claude Vision nur auf Wunsch
- native OCR nur bei echten PWA-Grenzen

## Was bewusst nicht Teil des MVP ist

- perfekte Extraktion von Region, Land, Rebsorte und Stil aus jedem Etikett
- Echtzeit-Kamera-Erkennung
- automatische Duplikaterkennung aus Scanresultaten
- zwingende Integration externer Modelle
- kostenpflichtige Erkennung im Standardpfad

## Umgang mit Claude Vision als Fallback

Claude Vision bleibt eine `spaetere, optionale Eskalationsstufe`.

Sinnvoll erst, wenn:

- OCR-Assistenz im Alltag zu oft scheitert
- Benutzer mehr Vollautomatik erwarten
- der Scan einen klar messbaren Produktwert bringt

Wenn spaeter aktiviert, dann nur mit Leitplanken:

- `disabled by default`
- keine automatische Aktivierung beim ersten Scan
- Aktivierung nur nach fehlgeschlagenem oder schwachem lokalem Ergebnis
- Aktivierung nur per bewusster Benutzeraktion wie `Mit Claude Vision erneut versuchen`
- diese Aktivierung gilt nur fuer den aktuellen Scan
- Kosten sichtbar machen
- weiterhin manuelle Bestaetigung vor Speicherung

Empfohlene Produktregel:

- Standard-CTA: `Etikett scannen`
- Nur bei schwachem Ergebnis zusaetzliche CTA: `Mit Claude Vision erneut versuchen`
- Kein globaler Automatismus, der ohne Benutzerentscheid Kosten ausloest

## Repo-bezogene Auswirkungen

### Kurzfristig aendern

- [src/components/WineLabelScanner.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/components/WineLabelScanner.tsx)
- [src/pages/AddWine.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/AddWine.tsx)
- [packages/core/src/lib](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/packages/core/src/lib)
- [packages/core/index.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/packages/core/index.ts)

### Spaeter pruefen

- [src/pages/Tasting.tsx](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/pages/Tasting.tsx)
- [src/lib/invoiceParse.ts](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/src/lib/invoiceParse.ts) nur fuer Dokument-Fallbacks

## Risiken

- Browser-OCR wird bei dekorativen oder kleinen Etiketten inkonsistent bleiben.
- Zu aggressive Heuristiken erzeugen falsches Vertrauen.
- Zu defensive Heuristiken machen das Feature gefuehlt nutzlos.
- Grosse Bilder koennen Performance auf Mobilgeraeten belasten.

## Erfolgskriterien

Die Strategie ist erfolgreich, wenn:

- der Scan bei einem sinnvollen Anteil der Bilder `Name`, `Produzent` oder `Jahrgang` brauchbar vorfuellt
- Benutzer sichtbar weniger tippen muessen
- die Erkennung keine versteckten Fehlimporte erzeugt
- der Standardpfad ohne laufende API-Kosten funktioniert

## Beziehung zur PWA-Strategie

Diese Erkennungsstrategie ist eine Vertiefung der Plattformentscheidung in [docs/pwa-first-strategy.md](/Users/yvesackermann/.codex/worktrees/fd5d/vinotheque-aid/docs/pwa-first-strategy.md).

Reihenfolge:

1. PWA-Fundament
2. Mobile Erfassung in der PWA
3. Erkennung als Assistenz

Das ist bewusst die empfohlene Abfolge. Erkennung lohnt sich am meisten, wenn die PWA-Basis und der mobile Kamera-Flow bereits stabil sind.
