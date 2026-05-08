# Codex — Phase 1: iOS App schaerfen

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`

## Ziel

Die iOS-App auf ihren Kernfokus reduzieren: **Erfassen, Entscheiden, Bewerten**. Sieben Tabs werden zu vier. Der "Heute oeffnen"-Flow entsteht. Shopping wird auf Quick-Add vereinfacht.

Phase 1 ist unabhaengig von Phase 0 und kann parallel ausgefuehrt werden.

---

## Was bereits existiert (Referenz, nicht anfassen)

```
apps/mobile/lib/features.ts           MOBILE_TAB_DEFINITIONS[] — hier werden Tabs konfiguriert
apps/mobile/app/(tabs)/_layout.tsx    liest getEnabledMobileTabs(), keine Aenderung noetig
apps/mobile/app/(tabs)/index.tsx      Kellerliste mit Suche und Typ-Filter
apps/mobile/app/(tabs)/add.tsx        Wein erfassen (langer Flow)
apps/mobile/app/(tabs)/tasting.tsx    Degu-Screen
apps/mobile/app/(tabs)/shopping.tsx   Einkaufsliste — wird vereinfacht
apps/mobile/app/wine/[id].tsx         Weindetail mit consumeWine, updateWine aus Store
apps/mobile/components/ui/WineCard.tsx zeigt getDrinkStatus() bereits an
apps/mobile/store/useWineStore.ts     consumeWine(id, qty), updateWine(wine), addShoppingItem(item)
packages/core/src/lib/wineHelpers.ts  getDrinkStatus() — wird erweitert
```

**Wichtige Store-Methoden (bereits vorhanden):**
- `consumeWine(wineId: string, quantity: number)` — reduziert Menge, legt ConsumedWine an, synct mit API
- `updateWine(wine: Wine)` — speichert Aenderungen, synct mit API
- `addShoppingItem(item: ShoppingItem)` — fuegt Eintrag hinzu, synct mit API

---

## TASK 1 — Tab-Bar auf 4 reduzieren

### 1.1 `getDrinkStatus` — unknown-Fall ergaenzen

**Problem:** Wenn `drinkFrom=0` und `drinkUntil=0` (nicht gesetzt), gibt die Funktion faelschlicherweise "ueberschritten" zurueck, weil `currentYear > 0`. Das muss zuerst behoben werden.

In `packages/core/src/lib/wineHelpers.ts` — Funktion `getDrinkStatus` ersetzen:

```typescript
export function getDrinkStatus(wine: Wine): {
  label: string;
  status: "lagern" | "trinkreif" | "bald" | "ueberschritten" | "unknown";
} {
  const year = new Date().getFullYear();
  if (!wine.drinkFrom || !wine.drinkUntil || (wine.drinkFrom === 0 && wine.drinkUntil === 0)) {
    return { label: "", status: "unknown" };
  }
  if (year < wine.drinkFrom)   return { label: "Noch lagern",  status: "lagern" };
  if (year >= wine.drinkUntil) return { label: "Bald trinken", status: "bald" };
  if (year <= wine.drinkUntil) return { label: "Trinkreif",    status: "trinkreif" };
  return                              { label: "Überschritten", status: "ueberschritten" };
}
```

In `apps/mobile/components/ui/WineCard.tsx` — Status-Stil fuer `unknown` und `bald` ergaenzen:

```typescript
// Im StyleSheet — ergaenzen:
status_unknown:   { color: "transparent" },
status_bald:      { color: "#ca8a04" },
```

Und die Render-Zeile — `status="unknown"` soll nichts anzeigen:

```typescript
{status !== "unknown" && (
  <Text style={[styles.status, styles[`status_${status}`]]}>{label}</Text>
)}
```

### 1.2 Tab-Definitionen umbauen

In `apps/mobile/lib/features.ts` — `MOBILE_TAB_DEFINITIONS` ersetzen:

```typescript
import {
  MoreHorizontal,
  PlusCircle,
  Star,
  Wine,
  type LucideIcon,
} from "lucide-react-native";

// ... (Typen unveraendert)

export const MOBILE_TAB_DEFINITIONS: MobileTabDefinition[] = [
  { name: "index",    title: "Mein Keller",    tabBarLabel: "Keller",   icon: Wine,          featureKey: "inventory" },
  { name: "add",      title: "Wein erfassen",  tabBarLabel: "Erfassen", icon: PlusCircle,    featureKey: "inventory" },
  { name: "tasting",  title: "Wein-Degu",      tabBarLabel: "Degu",     icon: Star,          featureKey: "inventory" },
  { name: "mehr",     title: "Mehr",           tabBarLabel: "Mehr",     icon: MoreHorizontal },
];
```

Entferne die nicht mehr genutzten Imports (Map, Heart, ShoppingCart, Settings) wenn sie nur in MOBILE_TAB_DEFINITIONS verwendet wurden.

### 1.3 "Mehr"-Tab anlegen

Neue Datei `apps/mobile/app/(tabs)/mehr.tsx`:

```typescript
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Map, Heart, ShoppingCart, Settings, ChevronRight, type LucideIcon,
} from "lucide-react-native";

type MenuEntry = { label: string; subtitle?: string; icon: LucideIcon; href: string };

const ENTRIES: MenuEntry[] = [
  { label: "Einkaufsliste",  subtitle: "Schnell hinzufuegen", icon: ShoppingCart, href: "/(tabs)/shopping" },
  { label: "Merkliste",      subtitle: "Ansicht im Web empfohlen", icon: Heart,   href: "/(tabs)/wishlist" },
  { label: "Weinregionen",   subtitle: "Interaktive Karte",   icon: Map,          href: "/(tabs)/map" },
  { label: "Einstellungen",  icon: Settings,                                       href: "/(tabs)/settings" },
];

export default function MehrScreen() {
  const router = useRouter();
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Mehr</Text>
      {ENTRIES.map((e) => (
        <Pressable key={e.href} style={s.row} onPress={() => router.push(e.href as never)}>
          <e.icon size={22} color="#8B1A1A" style={s.icon} />
          <View style={s.text}>
            <Text style={s.label}>{e.label}</Text>
            {e.subtitle && <Text style={s.sub}>{e.subtitle}</Text>}
          </View>
          <ChevronRight size={18} color="#ccc" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf7f4" },
  content:   { padding: 20 },
  title:     { fontSize: 28, fontWeight: "700", color: "#1a0500", marginBottom: 24 },
  row:       { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  icon:      { marginRight: 14 },
  text:      { flex: 1 },
  label:     { fontSize: 15, fontWeight: "600", color: "#1a0500" },
  sub:       { fontSize: 12, color: "#999", marginTop: 2 },
});
```

Die Tabs `map.tsx`, `settings.tsx`, `wishlist.tsx`, `shopping.tsx` bleiben als Dateien erhalten — sie sind weiterhin als Routen erreichbar, nur nicht mehr in der Tab-Bar.

---

## TASK 2 — "Heute oeffnen"-Flow

### 2.1 Button im Weindetail

In `apps/mobile/app/wine/[id].tsx` — innerhalb des nicht-editierenden Ansichts-JSX einen prominenten Button ergaenzen.

Suche die Stelle wo bereits `consumeWine` verwendet wird oder wo andere Aktions-Buttons sind, und ergaenze:

```typescript
// Import ergaenzen (falls nicht vorhanden):
import { useRouter } from "expo-router";

// Im JSX — gut sichtbar, vor oder nach bestehenden Aktionen:
{(wine.quantity ?? 0) > 0 && (
  <TouchableOpacity
    style={styles.openBtn}
    onPress={() => router.push({ pathname: "/wine/open/[id]", params: { id: wine.id } })}
  >
    <Text style={styles.openBtnText}>Heute oeffnen</Text>
  </TouchableOpacity>
)}

// Styles ergaenzen:
// openBtn:     { backgroundColor: "#8B1A1A", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 16 },
// openBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
```

### 2.2 Open-Screen anlegen

Neue Datei `apps/mobile/app/wine/open/[id].tsx`:

```typescript
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWineStore } from "@/store/useWineStore";

export const PENDING_RATINGS_KEY = "vinotheque.pendingRatings";

export type PendingRating = {
  wineId: string;
  wineName: string;
  wineProducer: string;
  wineVintage: number;
  openedAt: string;
  occasion: string;
};

export default function WineOpenScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { wines, consumeWine } = useWineStore();
  const wine = wines.find((w) => w.id === id);

  const [qty, setQty] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [saving, setSaving] = useState(false);

  if (!wine) return null;

  async function handleConfirm() {
    if (!wine) return;
    setSaving(true);
    try {
      await consumeWine(wine.id, qty);

      // Pending Rating speichern
      const raw = await AsyncStorage.getItem(PENDING_RATINGS_KEY);
      const pending: Record<string, PendingRating> = raw ? JSON.parse(raw) : {};
      pending[wine.id] = {
        wineId: wine.id,
        wineName: wine.name,
        wineProducer: wine.producer,
        wineVintage: wine.vintage,
        openedAt: new Date().toISOString(),
        occasion,
      };
      await AsyncStorage.setItem(PENDING_RATINGS_KEY, JSON.stringify(pending));

      router.back();
      router.back(); // zurueck zur Kellerliste
    } catch {
      Alert.alert("Fehler", "Konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>{wine.name}</Text>
      <Text style={s.sub}>{wine.producer} · {wine.vintage}</Text>
      <Text style={s.sub}>Im Keller: {wine.quantity} Flasche{wine.quantity !== 1 ? "n" : ""}</Text>

      <Text style={s.label}>Anzahl Flaschen oeffnen</Text>
      <View style={s.qtyRow}>
        <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
          <Text style={s.qtyBtnTxt}>–</Text>
        </TouchableOpacity>
        <Text style={s.qtyVal}>{qty}</Text>
        <TouchableOpacity style={s.qtyBtn} onPress={() => setQty((q) => Math.min(wine.quantity, q + 1))}>
          <Text style={s.qtyBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.label}>Anlass (optional)</Text>
      <TextInput
        style={s.input}
        value={occasion}
        onChangeText={setOccasion}
        placeholder="z.B. Abendessen, Geburtstag"
        placeholderTextColor="#aaa"
      />

      <TouchableOpacity style={[s.confirmBtn, saving && s.disabled]} onPress={handleConfirm} disabled={saving}>
        <Text style={s.confirmBtnTxt}>{saving ? "Wird gespeichert…" : `${qty} Flasche${qty !== 1 ? "n" : ""} oeffnen`}</Text>
      </TouchableOpacity>

      <Text style={s.hint}>Nach dem Trinken kannst du den Wein bewerten. Ein Hinweis erscheint in der Kellerliste.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#faf7f4" },
  content:      { padding: 24 },
  title:        { fontSize: 24, fontWeight: "700", color: "#1a0500", marginBottom: 4 },
  sub:          { fontSize: 14, color: "#777", marginBottom: 4 },
  label:        { fontSize: 14, fontWeight: "600", color: "#555", marginTop: 24, marginBottom: 8 },
  qtyRow:       { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 8 },
  qtyBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: "#8B1A1A", justifyContent: "center", alignItems: "center" },
  qtyBtnTxt:    { color: "#fff", fontSize: 22, fontWeight: "700" },
  qtyVal:       { fontSize: 28, fontWeight: "700", color: "#1a0500", minWidth: 40, textAlign: "center" },
  input:        { backgroundColor: "#fff", borderRadius: 10, padding: 14, fontSize: 15, color: "#1a0500", borderWidth: 1, borderColor: "#e0d5cf" },
  confirmBtn:   { backgroundColor: "#8B1A1A", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 32 },
  confirmBtnTxt:{ color: "#fff", fontSize: 17, fontWeight: "700" },
  disabled:     { opacity: 0.5 },
  hint:         { fontSize: 12, color: "#aaa", textAlign: "center", marginTop: 16, lineHeight: 18 },
});
```

---

## TASK 3 — Quick Rating nach dem Trinken

### 3.1 Pending-Rating-Banner in der Kellerliste

In `apps/mobile/app/(tabs)/index.tsx` — State und Banner ergaenzen:

```typescript
// Imports ergaenzen:
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { PENDING_RATINGS_KEY, type PendingRating } from "@/app/wine/open/[id]";

// Im Funktionskoerper des CellarScreen ergaenzen:
const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([]);

useEffect(() => {
  async function load() {
    const raw = await AsyncStorage.getItem(PENDING_RATINGS_KEY);
    if (!raw) return;
    const obj: Record<string, PendingRating> = JSON.parse(raw);
    setPendingRatings(Object.values(obj));
  }
  load();
}, []);

// Im JSX — ganz oben, vor der Suchleiste:
{pendingRatings.length > 0 && (
  <TouchableOpacity
    style={styles.ratingBanner}
    onPress={() => router.push({ pathname: "/wine/rate/[id]", params: { id: pendingRatings[0].wineId } })}
  >
    <Text style={styles.ratingBannerTitle}>
      {pendingRatings.length} offene Bewertung{pendingRatings.length !== 1 ? "en" : ""}
    </Text>
    <Text style={styles.ratingBannerSub}>"{pendingRatings[0].wineName}" — Wie war er?</Text>
  </TouchableOpacity>
)}

// Styles ergaenzen:
// ratingBanner:      { backgroundColor: "#1a0500", margin: 12, marginBottom: 0, borderRadius: 10, padding: 14 },
// ratingBannerTitle: { color: "#e8d5b0", fontWeight: "700", fontSize: 14 },
// ratingBannerSub:   { color: "#a08060", fontSize: 12, marginTop: 2 },
```

### 3.2 Rating-Screen anlegen

Neue Datei `apps/mobile/app/wine/rate/[id].tsx`:

```typescript
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWineStore } from "@/store/useWineStore";
import { PENDING_RATINGS_KEY } from "@/app/wine/open/[id]";

export default function WineRateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { wines, updateWine } = useWineStore();
  const wine = wines.find((w) => w.id === id);

  const [stars, setStars] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!wine) return null;

  async function removePending() {
    const raw = await AsyncStorage.getItem(PENDING_RATINGS_KEY);
    if (!raw) return;
    const obj: Record<string, unknown> = JSON.parse(raw);
    delete obj[id!];
    await AsyncStorage.setItem(PENDING_RATINGS_KEY, JSON.stringify(obj));
  }

  async function handleSave() {
    if (stars === 0) { Alert.alert("Bitte Sterne auswaehlen"); return; }
    setSaving(true);
    try {
      const dateStr = new Date().toLocaleDateString("de-CH");
      const appendNote = note.trim()
        ? `\n\n[${dateStr}] ${note.trim()}`
        : `\n\n[${dateStr}] Bewertet mit ${stars} Stern${stars !== 1 ? "en" : ""}.`;

      await updateWine({
        ...wine,
        personalRating: stars,
        notes: (wine.notes ?? "") + appendNote,
      });
      await removePending();
      router.back();
    } catch {
      Alert.alert("Fehler", "Bewertung konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLater() {
    router.back();
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>{wine.name}</Text>
      <Text style={s.sub}>{wine.producer} · {wine.vintage}</Text>

      <Text style={s.label}>Bewertung</Text>
      <View style={s.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setStars(n)} style={s.star}>
            <Text style={[s.starTxt, n <= stars && s.starActive]}>★</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Notiz (optional)</Text>
      <TextInput
        style={s.input}
        value={note}
        onChangeText={setNote}
        placeholder="Eindruck, Speisekombination, Anlass…"
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={3}
        maxLength={280}
      />
      <Text style={s.charCount}>{note.length}/280</Text>

      <TouchableOpacity style={[s.saveBtn, saving && s.disabled]} onPress={handleSave} disabled={saving}>
        <Text style={s.saveBtnTxt}>{saving ? "Speichere…" : "Bewertung speichern"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.laterBtn} onPress={handleLater}>
        <Text style={s.laterBtnTxt}>Spaeter bewerten</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#faf7f4" },
  content:    { padding: 24 },
  title:      { fontSize: 24, fontWeight: "700", color: "#1a0500", marginBottom: 4 },
  sub:        { fontSize: 14, color: "#777", marginBottom: 4 },
  label:      { fontSize: 14, fontWeight: "600", color: "#555", marginTop: 24, marginBottom: 10 },
  starsRow:   { flexDirection: "row", gap: 12 },
  star:       { padding: 4 },
  starTxt:    { fontSize: 40, color: "#ddd" },
  starActive: { color: "#f59e0b" },
  input:      { backgroundColor: "#fff", borderRadius: 10, padding: 14, fontSize: 15, color: "#1a0500", borderWidth: 1, borderColor: "#e0d5cf", minHeight: 90, textAlignVertical: "top" },
  charCount:  { fontSize: 11, color: "#bbb", textAlign: "right", marginTop: 4 },
  saveBtn:    { backgroundColor: "#8B1A1A", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 28 },
  saveBtnTxt: { color: "#fff", fontSize: 17, fontWeight: "700" },
  disabled:   { opacity: 0.5 },
  laterBtn:   { padding: 16, alignItems: "center", marginTop: 8 },
  laterBtnTxt:{ color: "#999", fontSize: 15 },
});
```

---

## TASK 4 — Shopping auf Quick-Add reduzieren

In `apps/mobile/app/(tabs)/shopping.tsx` — gesamten Inhalt ersetzen:

```typescript
import {
  Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useState } from "react";
import { useWineStore } from "@/store/useWineStore";
import { FeatureUnavailableCard } from "@/components/FeatureUnavailableCard";
import { useAppRuntime } from "@/providers/AppRuntimeProvider";
import { createId } from "@vinotheque/core";
import type { ShoppingItem } from "@vinotheque/core";

export default function ShoppingScreen() {
  const { shopping, addShoppingItem, removeShoppingItem } = useWineStore();
  const { isFeatureEnabled } = useAppRuntime();
  const [input, setInput] = useState("");

  if (!isFeatureEnabled("shopping")) {
    return (
      <FeatureUnavailableCard
        title="Einkaufsliste"
        description="Diese Funktion ist aktuell nicht verfuegbar."
      />
    );
  }

  async function handleAdd() {
    const name = input.trim();
    if (!name) return;
    const item: ShoppingItem = { id: createId(), name, producer: "", quantity: 1, estimatedPrice: 0, reason: "", checked: false };
    await addShoppingItem(item);
    setInput("");
  }

  function confirmRemove(item: ShoppingItem) {
    Alert.alert("Loeschen", `"${item.name}" entfernen?`, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Loeschen", style: "destructive", onPress: () => removeShoppingItem(item.id) },
    ]);
  }

  const recent = shopping.filter((i) => !i.checked).slice(0, 10);

  return (
    <View style={s.container}>
      <Text style={s.title}>Einkaufsliste</Text>
      <Text style={s.hint}>Die vollstaendige Verwaltung erfolgt in der Web-App.</Text>

      <View style={s.addRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Wein, Produzent, Bemerkung"
          placeholderTextColor="#aaa"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
          <Text style={s.addBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recent}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} onLongPress={() => confirmRemove(item)}>
            <Text style={s.rowName}>{item.name}</Text>
            <Text style={s.rowHint}>Lang tippen zum Loeschen</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>Noch nichts auf der Liste.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf7f4", padding: 20 },
  title:     { fontSize: 24, fontWeight: "700", color: "#1a0500", marginBottom: 4 },
  hint:      { fontSize: 13, color: "#aaa", marginBottom: 20 },
  addRow:    { flexDirection: "row", gap: 10, marginBottom: 20 },
  input:     { flex: 1, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#1a0500", borderWidth: 1, borderColor: "#e0d5cf" },
  addBtn:    { width: 48, height: 48, backgroundColor: "#8B1A1A", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  addBtnTxt: { color: "#fff", fontSize: 24, fontWeight: "300" },
  list:      { gap: 8 },
  row:       { backgroundColor: "#fff", borderRadius: 10, padding: 14 },
  rowName:   { fontSize: 15, color: "#1a0500", fontWeight: "500" },
  rowHint:   { fontSize: 11, color: "#ccc", marginTop: 2 },
  empty:     { color: "#bbb", textAlign: "center", marginTop: 40 },
});
```

---

## Abschluss

### TypeScript-Check

```bash
cd packages/core && npx tsc --noEmit
cd ../..
cd apps/mobile && npx tsc --noEmit -p tsconfig.json
```

### Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(ios): Phase 1 - iOS App schaerfen

Tab-Bar:
- Reduziert von 7 auf 4 Tabs: Keller, Erfassen, Degu, Mehr
- MOBILE_TAB_DEFINITIONS in lib/features.ts angepasst
- Neuer Mehr-Screen mit Navigation zu Shopping, Merkliste, Karte, Einstellungen

getDrinkStatus (packages/core):
- Neuer Status "unknown" wenn drinkFrom/drinkUntil nicht gesetzt
- Neuer Status "bald" fuer Weine die bald ueberschritten sind
- WineCard zeigt "unknown" nicht an (kein leerer Platzhalter)

Heute-oeffnen-Flow:
- Button im Weindetail bei quantity > 0
- app/wine/open/[id].tsx: Mengenauswahl + Anlass, ruft consumeWine()
- Pending Rating wird in AsyncStorage gespeichert

Quick Rating:
- Banner in Kellerliste wenn offene Bewertungen vorhanden
- app/wine/rate/[id].tsx: 5-Sterne + Notiz, haengt an Wine.notes an

Shopping:
- Vereinfacht auf Quick-Add + Letzte-10-Liste
- Vollstaendige Verwaltung im Web

EOF
)"
```

### Push

```bash
git push -u origin claude/plan-app-architecture-6dUk6
```

---

## Was du NICHT tun sollst

- `map.tsx`, `settings.tsx`, `wishlist.tsx` nicht loeschen — sie bleiben als Routen
- Den bestehenden Add-Flow (`add.tsx`) nicht verkuerzen — er ist der Haupterfassungsweg
- Kein `expo run:ios` oder Build-Aufruf
- Keine neuen npm-Packages ausser wenn absolut noetig (alle benoetigen Libraries sind installiert)
- `consumeWine` aus dem Store direkt nutzen — nicht neu implementieren
- `getDrinkStatus` Rueckgabe-Typ aendert sich: sicherstellen dass bestehende Nutzungen in `WineCard` und `wine/[id].tsx` mit `"bald"` und `"unknown"` umgehen koennen (Style fuer `status_bald` und `status_unknown` ergaenzen)
