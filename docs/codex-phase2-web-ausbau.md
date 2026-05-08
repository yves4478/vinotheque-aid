# Codex — Phase 2: Web App ausbauen

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`

## Ziel

Die Web-App wird zum Planungs- und Analyse-Tool. Vier unabhaengige Verbesserungen: Dashboard mit Trinkreife-Analyse, besserer Merkliste-Promotion-Flow, Einkaufsliste mit Priorisierung, Keller-Bulk-Aktionen.

Phase 2 ist unabhaengig von Phase 0 und 1 und kann parallel ausgefuehrt werden.
Task 5 (Cloud Storage Migration) hat eine Abhaengigkeit auf Phase 0 — er wird zuletzt und nur ausgefuehrt wenn Phase 0 abgeschlossen ist.

---

## Was bereits existiert (Referenz, nicht anfassen)

```
src/pages/Index.tsx            Dashboard — hat StatCards, aber keine Trinkreife-Filterung
src/pages/Cellar.tsx           Keller — hat Typ-Filter und Suche, aber keinen URL-Filter-Param
src/pages/Shopping.tsx         Einkaufsliste — hat Check/Uncheck, kein Priorisierung
src/pages/Wishlist.tsx         Merkliste — hat navigate(/add?mode=cellar...) fuer Promotion
src/data/wines.ts              getDrinkStatus(wine): {label, color} — hat keinen unknown-Fall
src/hooks/useWineStore.tsx     useWineStore: wines, addWine, updateWine, deleteWine,
                               shoppingItems, addShoppingItem, toggleShoppingItem, removeShoppingItem,
                               wishlistItems, addWishlistItem, updateWishlistItem, removeWishlistItem
src/features/webFeatures.tsx   WEB_ROUTE_DEFINITIONS[]
src/App.tsx                    React Router
```

**Installierte Libraries:** recharts@2.15.4, sonner@1.7.4, shadcn/ui, lucide-react, React Router v6.

**Store-Methoden (bestehend):**
- `addWine(wine: Omit<Wine, "id">): Wine`
- `updateWine(id: string, updates: Partial<Wine>): void`
- `deleteWine(id: string): void`
- `addShoppingItem(item: Omit<ShoppingItem, "id" | "checked">): void`

---

## TASK 1 — getDrinkStatus fix + Dashboard Trinkreife-Analyse

### 1.1 getDrinkStatus in `src/data/wines.ts` korrigieren

**Problem:** Wenn `drinkFrom=0` und `drinkUntil=0`, gibt die Funktion "Überschritten" zurueck. Ausserdem fehlt "Bald trinken".

Ersetze die bestehende Funktion `getDrinkStatus` (ca. Zeile 297):

```typescript
export function getDrinkStatus(wine: Wine): { label: string; color: string; status: "lagern" | "trinkreif" | "bald" | "ueberschritten" | "unknown" } {
  const year = new Date().getFullYear();
  if (!wine.drinkFrom || !wine.drinkUntil || (wine.drinkFrom === 0 && wine.drinkUntil === 0)) {
    return { label: "", color: "text-muted-foreground", status: "unknown" };
  }
  if (year < wine.drinkFrom)    return { label: "Noch lagern",  color: "text-amber-600",  status: "lagern" };
  if (year >= wine.drinkUntil)  return { label: "Bald trinken", color: "text-orange-500", status: "bald" };
  if (year <= wine.drinkUntil)  return { label: "Trinkreif",    color: "text-green-600",  status: "trinkreif" };
  return                               { label: "Überschritten", color: "text-red-600",    status: "ueberschritten" };
}
```

Pruefe danach alle Stellen im Web-Code, die `.label` oder `.color` von `getDrinkStatus()` verwenden — sie muessen weiter funktionieren. Der neue `.status`-Key ist additiv und bricht nichts.

### 1.2 Cellar-Filter-Param in `src/pages/Cellar.tsx`

Ergaenze am Anfang der `Cellar`-Komponente nach den bestehenden State-Deklarationen:

```typescript
import { useSearchParams } from "react-router-dom";

// In der Cellar-Komponente:
const [searchParams] = useSearchParams();
const drinkFilter = searchParams.get("filter") as "trinkreif" | "bald" | "lagern" | "ueberschritten" | null;
```

Ergaenze in der Filter-Logik (wo heute nach `typeFilter` und `search` gefiltert wird):

```typescript
// Nach bestehenden Filterzeilen:
.filter((wine) => {
  if (!drinkFilter) return true;
  return getDrinkStatus(wine).status === drinkFilter;
})
```

Wenn `drinkFilter` aktiv ist, zeige einen Hinweis-Badge oben in der Keller-Liste:

```typescript
{drinkFilter && (
  <div className="flex items-center gap-2 mb-4 px-1">
    <Badge variant="secondary">
      Filter: {drinkFilter === "trinkreif" ? "Trinkreif" : drinkFilter === "bald" ? "Bald trinken" : drinkFilter === "lagern" ? "Noch lagern" : "Überschritten"}
    </Badge>
    <Button variant="ghost" size="sm" onClick={() => navigate("/cellar")}>× Filter entfernen</Button>
  </div>
)}
```

### 1.3 Dashboard in `src/pages/Index.tsx` erweitern

**a) Trinkreife-Stats berechnen** — im bestehenden `useMemo` fuer `stats` ergaenzen:

```typescript
// Bestehende stats-Berechnung bleibt. Ergaenze:
const drinkWindowStats = useMemo(() => {
  const counts = { trinkreif: 0, bald: 0, lagern: 0, ueberschritten: 0, unknown: 0 };
  for (const w of wines) {
    counts[getDrinkStatus(w).status]++;
  }
  return counts;
}, [wines]);
```

**b) Vier klickbare Trinkreife-Kacheln** — unterhalb der bestehenden StatCards-Grid einfuegen:

```typescript
import { useNavigate } from "react-router-dom";

// In der Index-Komponente:
const navigate = useNavigate();

// Im JSX nach dem Stats-Grid:
<div className="mb-8">
  <h2 className="text-lg font-semibold mb-3">Trinkreife</h2>
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {[
      { status: "trinkreif",     label: "Jetzt ideal",       count: drinkWindowStats.trinkreif,     cls: "border-green-200 bg-green-50 dark:bg-green-950/20" },
      { status: "bald",          label: "Bald trinken",       count: drinkWindowStats.bald,          cls: "border-orange-200 bg-orange-50 dark:bg-orange-950/20" },
      { status: "lagern",        label: "Noch lagern",        count: drinkWindowStats.lagern,        cls: "border-amber-200 bg-amber-50 dark:bg-amber-950/20" },
      { status: "ueberschritten",label: "Über Höhepunkt",     count: drinkWindowStats.ueberschritten,cls: "border-red-200 bg-red-50 dark:bg-red-950/20" },
    ].map((tile) => (
      <button
        key={tile.status}
        onClick={() => navigate(`/cellar?filter=${tile.status}`)}
        className={`rounded-xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-100 ${tile.cls}`}
      >
        <p className="text-3xl font-bold">{tile.count}</p>
        <p className="text-sm text-muted-foreground mt-1">{tile.label}</p>
      </button>
    ))}
  </div>
</div>
```

**c) Kleines Donut-Chart nach Weintyp** — nach den Trinkreife-Kacheln:

```typescript
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Im JSX:
const typeData = useMemo(() => {
  const counts: Record<string, number> = {};
  for (const w of wines) {
    counts[w.type] = (counts[w.type] ?? 0) + w.quantity;
  }
  return Object.entries(counts).map(([type, value]) => ({ name: getWineTypeLabel(type as WineType), value }));
}, [wines]);

{typeData.length > 0 && (
  <div className="mb-8">
    <h2 className="text-lg font-semibold mb-3">Bestand nach Typ</h2>
    <div className="glass-card p-4 flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
            {typeData.map((_, i) => (
              <Cell key={i} fill={["#8B1A1A","#c8956c","#e8d5b0","#4a7c59","#2d5a8e"][i % 5]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [`${v} Fl.`]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1">
        {typeData.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ["#8B1A1A","#c8956c","#e8d5b0","#4a7c59","#2d5a8e"][i % 5] }} />
            <span>{d.name}</span>
            <span className="text-muted-foreground ml-auto">{d.value} Fl.</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

Fehlende Imports ergaenzen: `WineType` aus `@/data/wines`, `getWineTypeLabel` ist bereits importiert.

---

## TASK 2 — Merkliste Promotion-Flow verbessern

Der bestehende "In den Keller"-Button navigiert zu `/add?mode=cellar&return=/wishlist&wishlistId=...`. Das funktioniert. Was fehlt: Duplikat-Erkennung und eine "Menge erhöhen"-Option.

### 2.1 Duplikat-Erkennung in `src/pages/Wishlist.tsx`

Ergaenze im Funktionskoerper der `Wishlist`-Komponente:

```typescript
const { wines } = useWineStore();

function findDuplicate(item: WishlistItem): Wine | undefined {
  const normalize = (s?: string | null) => (s ?? "").toLowerCase().trim();
  return wines.find(
    (w) =>
      normalize(w.name) === normalize(item.name) &&
      normalize(w.producer) === normalize(item.producer ?? "") &&
      (!item.vintage || w.vintage === item.vintage),
  );
}
```

### 2.2 Duplikat-Hinweis und "Menge erhöhen" im Item-Kontextmenue

Suche im JSX die Stelle wo der "In den Keller"-Button pro WishlistItem gerendert wird (ca. Zeile 522: `navigate('/add?mode=cellar...')`). Ergaenze davor eine Duplikat-Prueefung:

```typescript
// Pro WishlistItem:
const duplicate = findDuplicate(item);

// Statt nur "In den Keller" Button:
{duplicate ? (
  <div className="flex flex-col gap-1">
    <p className="text-xs text-amber-600">Moeglicherweise vorhanden: {duplicate.name} ({duplicate.quantity} Fl.)</p>
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          updateWine(duplicate.id, { quantity: duplicate.quantity + 1 });
          toast({ title: "Menge erhoeht", description: `${duplicate.name} jetzt ${duplicate.quantity + 1} Flaschen.` });
        }}
      >
        + 1 Flasche zum Keller
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => navigate(`/add?mode=cellar&return=/wishlist&wishlistId=${item.id}`)}
      >
        Trotzdem neu anlegen
      </Button>
    </div>
  </div>
) : (
  <Button
    size="sm"
    variant="outline"
    onClick={() => navigate(`/add?mode=cellar&return=/wishlist&wishlistId=${item.id}`)}
  >
    In den Keller
  </Button>
)}
```

Fehlende Imports ergaenzen: `useToast` (vermutlich schon importiert), `updateWine` aus `useWineStore`.

---

## TASK 3 — Einkaufsliste Priorisierung

### 3.1 ShoppingItem-Typ erweitern

In `src/hooks/useWineStore.tsx` — `ShoppingItem`-Interface ergaenzen:

```typescript
export interface ShoppingItem {
  // bestehende Felder bleiben:
  id: string;
  name: string;
  producer?: string;
  quantity: number;
  estimatedPrice: number;
  reason?: string;
  checked: boolean;
  // NEU:
  priority?: 1 | 2 | 3; // 1=hoch, 2=mittel, 3=niedrig
}
```

### 3.2 Shopping-Page erweitern

In `src/pages/Shopping.tsx`:

**a) Prioritaets-Badge-Helper ergaenzen (vor der Komponente):**

```typescript
const PRIORITY_LABEL = { 1: "Hoch", 2: "Mittel", 3: "Niedrig" } as const;
const PRIORITY_CLASS = {
  1: "bg-red-100 text-red-700",
  2: "bg-yellow-100 text-yellow-700",
  3: "bg-gray-100 text-gray-600",
} as const;
```

**b) Sortierung nach Prioritaet** — bestehende `unchecked`-Zeile ersetzen:

```typescript
const unchecked = shoppingItems
  .filter((i) => !i.checked)
  .sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));
```

**c) Prioritaets-Selector pro Item** — innerhalb der bestehenden Item-Zeile ergaenzen:

```typescript
// In der Item-Karte (rechts neben dem Loesch-Icon oder unter dem Namen):
<select
  value={item.priority ?? ""}
  onChange={(e) => {
    const val = e.target.value ? (parseInt(e.target.value) as 1 | 2 | 3) : undefined;
    // updateShoppingItem existiert noch nicht — direkt ueber die Store-Methode:
    // Pruefe ob updateShoppingItem im Store existiert, falls nicht: addShoppingItem ueberschreibt (upsert)
    const updated = { ...item, priority: val };
    // Verwende den verfuegbaren Store-Mechanismus (removeShoppingItem + addShoppingItem oder updateShoppingItem):
    removeShoppingItem(item.id);
    addShoppingItem({ name: updated.name, producer: updated.producer, quantity: updated.quantity, estimatedPrice: updated.estimatedPrice, reason: updated.reason, priority: updated.priority });
  }}
  className="text-xs border rounded px-1 py-0.5 bg-background"
>
  <option value="">Prioritaet</option>
  <option value="1">Hoch</option>
  <option value="2">Mittel</option>
  <option value="3">Niedrig</option>
</select>

{item.priority && (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CLASS[item.priority]}`}>
    {PRIORITY_LABEL[item.priority]}
  </span>
)}
```

**Hinweis zur Store-Methode:** Falls `updateShoppingItem` nicht im Store existiert, nutze `removeShoppingItem(id)` gefolgt von `addShoppingItem(...)`. Falls es existiert, verwende es direkt.

### 3.3 "Nachbestellen"-Button im Keller

In `src/pages/Cellar.tsx` — im DropdownMenu pro Wein (suche nach dem bestehenden `DropdownMenuContent`) einen weiteren Eintrag ergaenzen:

```typescript
// Im Dropdown-Menue jeder Weinkarte (wo bereits Loeschen/Bearbeiten ist):
<DropdownMenuItem
  onClick={() => {
    addShoppingItem({ name: wine.name, producer: wine.producer, quantity: 1, estimatedPrice: wine.purchasePrice, reason: `Nachbestellung (${wine.quantity} Fl. im Keller)` });
    toast({ title: "Zur Einkaufsliste hinzugefuegt", description: wine.name });
  }}
>
  <ShoppingCart className="w-4 h-4 mr-2" /> Nachbestellen
</DropdownMenuItem>
```

Fehlende Imports in `Cellar.tsx`: `addShoppingItem` aus `useWineStore`, `ShoppingCart` aus `lucide-react`.

---

## TASK 4 — Keller Bulk-Aktionen

### 4.1 Selektion-State

In `src/pages/Cellar.tsx` — nach den bestehenden State-Deklarationen ergaenzen:

```typescript
const [selected, setSelected] = useState<Set<string>>(new Set());
const toggleSelect = (id: string) =>
  setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
const selectAll = () => setSelected(new Set(filtered.map((w) => w.id)));
const clearSelection = () => setSelected(new Set());
```

### 4.2 Checkboxen in der Listen-Ansicht

Suche in `Cellar.tsx` den Render-Block der Wein-Zeilen (list-Ansicht) und ergaenze ganz links eine Checkbox:

```typescript
import { Checkbox } from "@/components/ui/checkbox";

// In jeder Zeile (table row oder card), ganz links:
<Checkbox
  checked={selected.has(wine.id)}
  onCheckedChange={() => toggleSelect(wine.id)}
  onClick={(e) => e.stopPropagation()}
/>
```

Ergaenze ausserdem im Tabellenkopf (falls Tabellenansicht) eine "Alle auswaehlen"-Checkbox:

```typescript
<TableHead className="w-10">
  <Checkbox
    checked={selected.size === filtered.length && filtered.length > 0}
    onCheckedChange={(checked) => checked ? selectAll() : clearSelection()}
  />
</TableHead>
```

### 4.3 Bulk-Action-Bar

Ergaenze in `src/pages/Cellar.tsx` — sticky am unteren Bildschirmrand, erscheint nur wenn `selected.size > 0`:

```typescript
{selected.size > 0 && (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t px-6 py-3 flex items-center gap-3 shadow-lg">
    <span className="text-sm font-medium mr-auto">
      {selected.size} Wein{selected.size !== 1 ? "e" : ""} ausgewaehlt
    </span>

    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        for (const id of selected) {
          const w = wines.find((x) => x.id === id);
          if (w) addShoppingItem({ name: w.name, producer: w.producer, quantity: 1, estimatedPrice: w.purchasePrice, reason: "Bulk-Nachbestellung" });
        }
        toast({ title: `${selected.size} Weine zur Einkaufsliste hinzugefuegt` });
        clearSelection();
      }}
    >
      <ShoppingCart className="w-4 h-4 mr-1" /> Nachbestellen
    </Button>

    <Button
      variant="destructive"
      size="sm"
      onClick={() => {
        if (!confirm(`${selected.size} Wein${selected.size !== 1 ? "e" : ""} wirklich loeschen?`)) return;
        for (const id of selected) deleteWine(id);
        toast({ title: `${selected.size} Weine geloescht` });
        clearSelection();
      }}
    >
      <Trash2 className="w-4 h-4 mr-1" /> Loeschen
    </Button>

    <Button variant="ghost" size="sm" onClick={clearSelection}>
      Abbrechen
    </Button>
  </div>
)}
```

Stelle sicher, dass das Keller-ScrollView unten genug Padding hat damit die Bulk-Bar nichts verdeckt (`pb-24` o.ae.).

---

## TASK 5 — Cloud Storage Migration (NUR wenn Phase 0 abgeschlossen)

**Voraussetzung:** Phase 0 muss komplett sein (MinIO laeuft, `WineImage`-Tabelle existiert, API-Endpoints `/api/wines/:id/images` existieren).

Falls Phase 0 noch nicht abgeschlossen ist: diesen Task ueberspringen.

### 5.1 Upload-Flow im Web umstellen

In `src/pages/AddWine.tsx` und `src/pages/Cellar.tsx` — Bild-Upload von Base64 auf Multipart umstellen:

```typescript
// Statt: images als Base64 in Wine.images speichern
// Neu: Bild als FormData an API schicken, URL zurueckerhalten

async function uploadImageToApi(wineId: string, file: File): Promise<string> {
  const compressed = await compressImage(file);
  // compressed ist base64 — zurueck zu Blob konvertieren:
  const res = await fetch(compressed);
  const blob = await res.blob();

  const formData = new FormData();
  formData.append("image", blob, "wine.jpg");

  const response = await fetch(`${API_BASE_URL}/api/wines/${wineId}/images`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error("Upload fehlgeschlagen");
  const data = await response.json();
  return data.url as string;
}
```

**Hinweis:** Die genaue Integration haengt davon ab wie der AddWine-Flow heute Bilder speichert. Lese `AddWine.tsx` vor der Umsetzung sorgfaeltig.

### 5.2 Migrations-Script

Neues Script `scripts/migrate-base64-to-minio.ts`:

```typescript
// Laedt alle Weine, findet Base64-Bilder in Wine.images, laedt sie nach MinIO hoch,
// erstellt WineImage-Eintraege, entfernt Base64 aus Wine.images.
// Idempotent: ueberspringt Weine die bereits WineImage-Eintraege haben.
```

Details sind abhaengig vom tatsaechlichen Schema nach Phase 0. Lese `apps/api/prisma/schema.prisma` vor der Implementierung.

---

## Abschluss

### TypeScript-Check

```bash
npx tsc --noEmit
npm run lint
```

### Commit

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(web): Phase 2 - Web App ausbauen

Dashboard:
- getDrinkStatus: fix unknown (drinkFrom=0), neuer Status "bald"
- Trinkreife-Kacheln klickbar, navigieren zu /cellar?filter=...
- Cellar liest filter-URL-Param, zeigt gefilterte Liste mit Badge
- Donut-Chart Bestand nach Weintyp (Recharts)

Merkliste:
- Duplikat-Erkennung: gleicher Name+Produzent+Jahrgang im Keller
- "Menge erhöhen" statt Neu-Anlegen wenn Duplikat gefunden

Einkaufsliste:
- ShoppingItem.priority: 1/2/3 (hoch/mittel/niedrig)
- Sortierung nach Prioritaet
- Prioritaets-Selector pro Item
- "Nachbestellen"-Button im Keller-Dropdown

Keller Bulk-Aktionen:
- Checkboxen in Listen-Ansicht, Alle-auswaehlen im Header
- Sticky Bulk-Bar: Nachbestellen + Loeschen fuer Selektion
- ESC-Aktion via Abbrechen-Button

EOF
)"
```

### Push

```bash
git push -u origin claude/plan-app-architecture-6dUk6
```

---

## Was du NICHT tun sollst

- `src/data/wines.ts`: Bestehende Wine-Felder und andere Funktionen nicht aendern — nur `getDrinkStatus` erweitern
- Kein neues State-Management-System einfuehren — nur bestehende `useWineStore`-Methoden verwenden
- Task 5 nicht ausfuehren wenn Phase 0 noch laeuft
- Keine neuen npm-Packages installieren — alle benoetigten sind vorhanden (recharts, sonner, shadcn/ui)
- `AppLayout` immer als Wrapper verwenden (wie in allen anderen Seiten)
- Kein Backend-Code ausser in Task 5 — Phase 2 ist rein Frontend
