// Einstellungen

import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useWineStore } from "@/store/useWineStore";
import { createId, testWines } from "@vinotheque/core";

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    activeEnv,
    setEnv,
    resetAll,
    wines,
    wishlist,
    shopping,
    addWine,
  } = useWineStore();

  function handleReset() {
    Alert.alert(
      "Alle Daten löschen",
      "Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Löschen", style: "destructive", onPress: resetAll },
      ],
    );
  }

  async function loadTestData() {
    for (const wine of testWines) {
      await addWine({ ...wine, id: createId() });
    }
  }

  async function handleLoadTestData() {
    if (wines.length > 0) {
      Alert.alert("Hinweis", "Es sind bereits Weine vorhanden. Testdaten trotzdem laden?", [
        { text: "Abbrechen", style: "cancel" },
        { text: "Laden", onPress: loadTestData },
      ]);
      return;
    }

    await loadTestData();
  }

  async function handleExport() {
    if (!FileSystem.documentDirectory) {
      Alert.alert("Export nicht möglich", "Das App-Dokumentverzeichnis ist nicht verfügbar.");
      return;
    }

    const payload = JSON.stringify({ wines, wishlist, shopping }, null, 2);
    const path = `${FileSystem.documentDirectory}vinotheque-export.json`;
    await FileSystem.writeAsStringAsync(path, payload, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(path, {
        mimeType: "application/json",
        dialogTitle: "Vinotheque Daten exportieren",
      });
      return;
    }

    Alert.alert("Export erstellt", "Die JSON-Datei wurde im App-Dokumentverzeichnis gespeichert.");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Keller</Text>
        <Text style={styles.label}>Kellername</Text>
        <TextInput
          style={styles.input}
          value={settings.cellarName}
          onChangeText={(v) => updateSettings({ cellarName: v })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{Constants.expoConfig?.version ?? "-"}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daten</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleExport}>
          <Text style={styles.secondaryBtnText}>Daten exportieren (JSON)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Entwicklung</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Testmodus</Text>
          <Switch
            value={activeEnv === "test"}
            onValueChange={(v) => setEnv(v ? "test" : "prod")}
          />
        </View>
        <Text style={styles.hint}>
          Im Testmodus werden separate Testdaten verwendet.
        </Text>
        {activeEnv === "test" && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleLoadTestData}>
            <Text style={styles.secondaryBtnText}>Testdaten laden</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleReset}>
          <Text style={styles.dangerBtnText}>Alle Daten löschen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#faf8f5" },
  content:     { padding: 16, paddingBottom: 32 },
  section:     { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle:{ fontSize: 13, fontWeight: "700", color: "#8B1A1A", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  label:       { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 6 },
  value:       { fontSize: 14, color: "#888" },
  input:       { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  row:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hint:        { fontSize: 12, color: "#999", marginTop: 4 },
  secondaryBtn:     { marginTop: 10, padding: 12, borderRadius: 8, backgroundColor: "#f4eaea", alignItems: "center" },
  secondaryBtnText: { color: "#8B1A1A", fontWeight: "600" },
  dangerBtn:   { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#dc2626", alignItems: "center" },
  dangerBtnText:{ color: "#dc2626", fontWeight: "600" },
});
