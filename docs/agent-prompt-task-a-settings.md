# Agent Prompt — Task A: Settings Screen vervollständigen

## Auftrag

Vervollständige den Einstellungen-Screen der Expo React Native App.
Der Screen ist ein Shell — du fügst die fehlenden Funktionen ein.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/mobile-framework-decision-FjfgL`
**Zieldatei:** `apps/mobile/app/(tabs)/settings.tsx`

---

## Was bereits funktioniert

- Kellername ändern (TextInput → updateSettings)
- Testmodus-Umschalten (Switch → setEnv)
- Alle Daten löschen (Alert → resetAll)

## Was du ergänzt

### 1 — App-Version anzeigen

```bash
cd apps/mobile && npm install expo-constants
```

```typescript
import Constants from "expo-constants";

// Im JSX, unterhalb des Keller-Blocks:
<View style={styles.section}>
  <Text style={styles.sectionTitle}>App</Text>
  <View style={styles.row}>
    <Text style={styles.label}>Version</Text>
    <Text style={styles.value}>{Constants.expoConfig?.version ?? "—"}</Text>
  </View>
</View>
```

Stil ergänzen:
```typescript
value: { fontSize: 14, color: "#888" },
```

---

### 2 — Testdaten laden (nur wenn Testmodus aktiv)

```typescript
import { testWines } from "@vinotheque/core";

// Im SettingsScreen:
const { wines, addWine, ... } = useWineStore();

async function handleLoadTestData() {
  if (wines.length > 0) {
    Alert.alert("Hinweis", "Es sind bereits Weine vorhanden. Testdaten trotzdem laden?", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Laden", onPress: loadTestData },
    ]);
  } else {
    await loadTestData();
  }
}

async function loadTestData() {
  for (const wine of testWines) {
    await addWine({ ...wine, id: createId() });
  }
}
```

Im JSX, im Entwicklungs-Block, unterhalb des Testmodus-Switch:
```typescript
{activeEnv === "test" && (
  <TouchableOpacity style={styles.secondaryBtn} onPress={handleLoadTestData}>
    <Text style={styles.secondaryBtnText}>Testdaten laden</Text>
  </TouchableOpacity>
)}
```

Stil:
```typescript
secondaryBtn:     { marginTop: 10, padding: 12, borderRadius: 8, backgroundColor: "#f4eaea", alignItems: "center" },
secondaryBtnText: { color: "#8B1A1A", fontWeight: "600" },
```

---

### 3 — Daten exportieren (JSON via System-Share-Sheet)

```bash
cd apps/mobile && npm install expo-sharing expo-file-system
```

(expo-file-system ist bereits in package.json, nur expo-sharing ist neu)

```typescript
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

const { wines, wishlist, shopping } = useWineStore();

async function handleExport() {
  const payload = JSON.stringify({ wines, wishlist, shopping }, null, 2);
  const path = FileSystem.documentDirectory + "vinotheque-export.json";
  await FileSystem.writeAsStringAsync(path, payload, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, {
      mimeType: "application/json",
      dialogTitle: "Vinotheque Daten exportieren",
    });
  }
}
```

Im JSX, neuer Block unterhalb Keller-Block:
```typescript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Daten</Text>
  <TouchableOpacity style={styles.secondaryBtn} onPress={handleExport}>
    <Text style={styles.secondaryBtnText}>Daten exportieren (JSON)</Text>
  </TouchableOpacity>
</View>
```

---

## Abschluss

- `apps/mobile/package.json` prüfen: `expo-sharing` in dependencies ergänzen
- TypeScript-Check: `./node_modules/.bin/tsc --noEmit -p apps/mobile/tsconfig.json`
- Commit mit Message: `feat(mobile): complete settings screen with version, test data and export`
- Push auf Branch `claude/mobile-framework-decision-FjfgL`
