# Transfer Agent Prompt — Vinotheque Mobile

## Deine Aufgabe

Du übernimmst die Code-Migration einer bestehenden React-Web-App in eine
Expo React Native Mobile-App. Das Gerüst ist bereits fertig. Du füllst die
Implementierungen ein, ohne den Web-Code zu verändern.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/mobile-framework-decision-FjfgL`

---

## Projektstruktur

```
vinotheque-aid/           ← Monorepo-Root (Web-App bleibt hier)
  src/                    ← WEB: bestehende React-App — NICHT ANFASSEN
  packages/
    core/                 ← Geteilte Logik (pure TypeScript, kein Browser, kein RN)
      src/
        types/wine.ts     ← Wine, WishlistItem, etc. — BEREITS FERTIG
        data/             ← Datendateien — SHELLS vorhanden, du füllst
        lib/              ← Helper-Funktionen — SHELLS vorhanden, du füllst
      index.ts
  apps/
    mobile/               ← Expo React Native App — GERÜST FERTIG
      app/
        _layout.tsx       ← Root-Layout — FERTIG
        (tabs)/
          _layout.tsx     ← Tab-Navigation — FERTIG
          index.tsx       ← Kellerliste — GERÜST FERTIG
          add.tsx         ← Wein erfassen — GERÜST FERTIG
          settings.tsx    ← Einstellungen — GERÜST FERTIG
        wine/
          [id].tsx        ← Weindetail — GERÜST FERTIG
      components/ui/
        WineCard.tsx      ← FERTIG
      store/
        useWineStore.ts   ← GERÜST FERTIG — du vervollständigst
```

---

## Schritt-für-Schritt Aufgaben

### AUFGABE 1 — packages/core/src/data/ befüllen

Kopiere diese Dateien 1:1 aus `src/data/` nach `packages/core/src/data/`:
- `countryRegions.ts` → ersetze den Shell-Inhalt vollständig
- `wineRegions.ts`    → ersetze den Shell-Inhalt vollständig
- `wineRegionMetadata.ts` → ersetze den Shell-Inhalt vollständig
- `testWines.ts`     → ersetze den Shell-Inhalt vollständig

**Achtung bei testWines.ts:**
- Feld `imageUrl` und `imageData` umbenennen zu `imageUri` (oder weglassen)
- Import-Pfad anpassen: `from "../types/wine"` statt `from "@/data/wines"`

**Achtung bei mockWines in `src/data/wines.ts`:**
- Diese Daten werden in `core` NICHT gebraucht (nur Testdaten aus testWines.ts)
- mockWines lässt du im Web-Code, ins Core kommt nur testWines

**Exports prüfen:** `packages/core/src/data/index.ts` re-exportiert alles,
keine Änderung dort nötig.

---

### AUFGABE 2 — packages/core/src/lib/ befüllen

#### 2a — wineUrlParser.ts

Kopiere `src/lib/wineUrlParser.ts` vollständig nach `packages/core/src/lib/wineUrlParser.ts`.

**Wichtige Anpassungen:**
- Import-Pfade: `from "@/data/wines"` → `from "../types/wine"`
- CORS-Proxy entfernen: In React Native gibt es keine CORS-Einschränkungen.
  Wenn der Web-Code einen Proxy-URL baut, ersetze das durch einen direkten
  Fetch auf die originale URL.
- `window`, `document`, `localStorage` kommen in dieser Datei nicht vor —
  kein Problem.

#### 2b — wishlistImport.ts

Kopiere `src/lib/wishlistImport.ts` vollständig nach `packages/core/src/lib/wishlistImport.ts`.

**Wichtige Anpassungen:**
- Import-Pfade: `from "@/data/wines"` → `from "../types/wine"`
             `from "@/lib/wineUrlParser"` → `from "./wineUrlParser"`
- Kein CORS-Proxy, keine Browser-APIs in dieser Datei erwartet.

#### 2c — utils.ts

Lies `src/lib/utils.ts`. Kopiere nur die platform-unabhängigen Teile:
- `createId()` — bereits in core vorhanden, prüfe ob es identisch ist
- Weitere pure Helper-Funktionen, falls vorhanden
- **NICHT kopieren:** `cn()` (tailwind/clsx), DOM-Helpers, Browser-spezifisches

---

### AUFGABE 3 — store/useWineStore.ts vervollständigen

Datei: `apps/mobile/store/useWineStore.ts`

Das Gerüst ist fertig. Du ergänzt die fehlenden Methoden analog zu
`src/hooks/useWineStore.tsx`, aber mit `AsyncStorage` statt `localStorage`.

**Fehlende Methoden (alle folgen dem gleichen Muster wie `addWine`):**

```typescript
// Shopping
addShoppingItem(item: ShoppingItem): Promise<void>
updateShoppingItem(updated: ShoppingItem): Promise<void>
removeShoppingItem(id: string): Promise<void>
toggleShoppingItem(id: string): Promise<void>

// Wishlist
addWishlistItem(item: WishlistItem): Promise<void>
updateWishlistItem(updated: WishlistItem): Promise<void>
removeWishlistItem(id: string): Promise<void>

// Merchants
addMerchant(merchant: Merchant): Promise<void>
updateMerchant(updated: Merchant): Promise<void>
removeMerchant(id: string): Promise<void>

// Consumed (als getrunken markieren)
consumeWine(wineId: string, quantity?: number): Promise<void>
// Logik: Wein.quantity um quantity (default 1) reduzieren,
//        ConsumedWine-Eintrag anlegen,
//        wenn quantity == 0, Wein aus Liste entfernen oder behalten (Settings?)
```

**Muster für alle Methoden:**
```typescript
const addXxx = useCallback(async (item: XxxType) => {
  const next = [...xxxList, item];
  setXxxList(next);
  await saveJson(storageKeys(activeEnv).xxx, next);
}, [xxxList, activeEnv]);
```

**Hinweis für spätere Optimierung (jetzt nicht nötig):**
Wenn die App wächst, lohnt sich Zustand + persist Middleware:
```
npm install zustand
```
Dann kann man den gesamten Store als Zustand-Store schreiben und AsyncStorage
als Storage-Adapter übergeben. Das ist sauberer als Context+Hooks.

---

### AUFGABE 4 — app/(tabs)/index.tsx (Kellerliste) vervollständigen

Datei: `apps/mobile/app/(tabs)/index.tsx`

Das Gerüst zeigt bereits Weine als FlatList. Ergänze:

1. **Suche:** TextInput oben, filtert nach `wine.name` und `wine.producer`
   ```typescript
   const [search, setSearch] = useState("");
   const filtered = wines.filter(w =>
     w.name.toLowerCase().includes(search.toLowerCase()) ||
     w.producer.toLowerCase().includes(search.toLowerCase())
   );
   ```

2. **Filter-Bar:** Horizontale ScrollView mit Typ-Filter-Buttons
   (Alle / Rot / Weiss / Rosé / Schaumwein / Dessert)

3. **WineCard verwenden:** Importiere `WineCard` aus `@/components/ui/WineCard`
   statt der inline renderWine-Funktion

4. **Loading-State:** `if (!loaded) return <ActivityIndicator />`

---

### AUFGABE 5 — app/(tabs)/add.tsx vervollständigen

Datei: `apps/mobile/app/(tabs)/add.tsx`

Fehlende Felder ergänzen (TODO-Kommentar im Code):
- `purchaseLocation` (TextInput)
- `purchaseDate` (TextInput mit Datumsformat YYYY-MM-DD, später DatePicker)
- `personalRating` (Sterne 1-5 als TouchableOpacity-Buttons)
- `isGift` + `giftFrom` (Switch + konditionales TextInput)
- `isRarity` (Switch)
- `bottleSize` (Picker oder Button-Gruppe aus BOTTLE_SIZES)
- `purchaseLink` (TextInput, optional)

Foto-Flow verbessern:
```typescript
// Bild komprimieren und in App-Verzeichnis speichern
import * as FileSystem from "expo-file-system";

async function saveImageLocally(uri: string): Promise<string> {
  const filename = `wine_${Date.now()}.jpg`;
  const dest = FileSystem.documentDirectory + filename;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}
```

---

### AUFGABE 6 — app/wine/[id].tsx vervollständigen

Datei: `apps/mobile/app/wine/[id].tsx`

1. **Foto anzeigen:**
   ```typescript
   {wine.imageUri && (
     <Image
       source={{ uri: wine.imageUri }}
       style={{ width: "100%", height: 240, borderRadius: 12, marginBottom: 16 }}
       resizeMode="cover"
     />
   )}
   ```

2. **Edit-Modus:**
   ```typescript
   const [editing, setEditing] = useState(false);
   ```
   Header-Button (via `useNavigation` oder `<Stack.Screen options={{ headerRight: ... }}>`)
   Wenn editing=true, TextInputs statt Text-Komponenten zeigen.
   Beim Speichern `useWineStore.updateWine(wine)` aufrufen.

3. **Flaschenzahl anpassen (Quick-Action):**
   ```typescript
   <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
     <TouchableOpacity onPress={() => adjustQuantity(-1)}>
       <Text style={{ fontSize: 24 }}>−</Text>
     </TouchableOpacity>
     <Text>{wine.quantity}</Text>
     <TouchableOpacity onPress={() => adjustQuantity(1)}>
       <Text style={{ fontSize: 24 }}>+</Text>
     </TouchableOpacity>
   </View>
   ```

4. **Als getrunken markieren:**
   ```typescript
   <TouchableOpacity onPress={() => consumeWine(wine.id)}>
     <Text>Eine Flasche trinken</Text>
   </TouchableOpacity>
   ```

---

### AUFGABE 7 — app/(tabs)/settings.tsx vervollständigen

Datei: `apps/mobile/app/(tabs)/settings.tsx`

1. **App-Version anzeigen:**
   ```typescript
   import Constants from "expo-constants";
   <Text>{Constants.expoConfig?.version}</Text>
   ```

2. **Testdaten laden (Testmodus):**
   Wenn `activeEnv === "test"` und `wines.length === 0`:
   ```typescript
   import { testWines } from "@vinotheque/core";
   async function loadTestData() {
     for (const w of testWines) await addWine(w);
   }
   ```

3. **Export (einfach, MVP):**
   ```typescript
   import * as Sharing from "expo-sharing";
   import * as FileSystem from "expo-file-system";
   async function exportData() {
     const data = JSON.stringify({ wines, wishlist, shopping }, null, 2);
     const path = FileSystem.documentDirectory + "vinotheque-export.json";
     await FileSystem.writeAsStringAsync(path, data);
     await Sharing.shareAsync(path);
   }
   ```
   Dependencies ergänzen: `expo-sharing`

---

## Was du NICHT tun sollst

- **Web-App (`src/`) nicht anfassen** — kein einziger Edit in `src/`
- Keine OCR-Integration jetzt (Tesseract.js läuft nicht in React Native)
- Keine Karten/Maps jetzt (react-native-maps ist ein separates Setup)
- Kein Vivino-Scraping jetzt (URL-Parser reicht als Shell)
- Keine Cloud-Sync jetzt
- Keine komplexen Animationen
- Kein Backend

---

## Dev-Setup nach Migration

Damit der Entwickler lokal testen kann:

```bash
# 1. Abhängigkeiten installieren
cd vinotheque-aid
npm install

cd apps/mobile
npm install

# 2. iOS Simulator starten (macOS + Xcode required)
npx expo run:ios

# Oder mit Expo Go (limitierter, aber kein Xcode Build nötig):
npx expo start
# -> QR-Code scannen mit Expo Go App auf iPhone
# -> oder 'i' drücken für Simulator
```

**Beim ersten Run:** Xcode muss installiert sein, iOS Simulator App gestartet.
Nach dem ersten Build: JS-Änderungen laden automatisch nach (Fast Refresh).
Neuer Native Build nur nötig bei neuen nativen Dependencies.

---

## Wichtige Hinweise

### AsyncStorage vs localStorage
```typescript
// WEB (nicht in Mobile verwenden):
localStorage.setItem("key", JSON.stringify(data));
const data = JSON.parse(localStorage.getItem("key") ?? "null");

// MOBILE (AsyncStorage — immer async!):
await AsyncStorage.setItem("key", JSON.stringify(data));
const raw = await AsyncStorage.getItem("key");
const data = raw ? JSON.parse(raw) : null;
```

### Import-Pfade in Mobile
```typescript
// Aus packages/core:
import type { Wine } from "@vinotheque/core";
import { getDrinkStatus, createId } from "@vinotheque/core";

// Innerhalb von apps/mobile (absolute Pfade via tsconfig baseUrl):
import { useWineStore } from "@/store/useWineStore";
import { WineCard } from "@/components/ui/WineCard";
```

### Kein `window`, `document`, `localStorage` in Mobile
Wenn du eine Funktion aus Core verwendest und sie schlägt fehl, prüfe ob sie
irgendwo Browser-APIs verwendet. Wenn ja, refactore sie so dass der
Browser-spezifische Teil im Web-Adapter bleibt.

### StyleSheet statt Tailwind
```typescript
// WEB:
<div className="flex flex-row gap-2 text-red-700">

// MOBILE:
<View style={{ flexDirection: "row", gap: 8 }}>
<Text style={{ color: "#b91c1c" }}>
```

Oder via StyleSheet.create() (bevorzugt):
```typescript
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  redText: { color: "#b91c1c" },
});
```

---

## Erfolg: Definition of Done

- [ ] `npx expo start` in `apps/mobile/` startet ohne Fehler
- [ ] iPhone Simulator zeigt die Tab-Navigation
- [ ] Wein kann erfasst werden (Name, Produzent, Jahrgang, Typ)
- [ ] Wein erscheint in der Kellerliste
- [ ] Tap auf Wein öffnet Detailseite
- [ ] Flaschenzahl kann angepasst werden
- [ ] Wein kann gelöscht werden
- [ ] Einstellungen: Kellername speichert sich
- [ ] Testmodus wechselt auf separate Daten
- [ ] Foto aus Bibliothek kann hinzugefügt werden
- [ ] Suche in der Kellerliste funktioniert
- [ ] Web-App unter `npm run dev` im Root läuft weiterhin ohne Fehler
