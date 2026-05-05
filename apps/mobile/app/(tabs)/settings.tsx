// Einstellungen

import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useWineStore } from "@/store/useWineStore";
import { FEATURE_FLAG_LABELS, createId, testWines, type FeatureFlagKey } from "@vinotheque/core";

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    activeEnv,
    resetAll,
    wines,
    wishlist,
    shopping,
    addWine,
  } = useWineStore();

  const isTestLocal = activeEnv === "test";
  const featureFlagEntries = Object.entries(FEATURE_FLAG_LABELS) as Array<[FeatureFlagKey, typeof FEATURE_FLAG_LABELS[FeatureFlagKey]]>;

  function updateFeatureFlag(feature: FeatureFlagKey, enabled: boolean) {
    updateSettings({
      featureFlags: {
        ...settings.featureFlags,
        [feature]: enabled,
      },
    });
  }

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
      {isTestLocal && (
        <View style={styles.testBanner}>
          <Text style={styles.testBannerText}>Test-Local</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Keller</Text>
        <Text style={styles.label}>Kellername</Text>
        <TextInput
          style={styles.input}
          value={settings.cellarName}
          onChangeText={(v) => updateSettings({ cellarName: v })}
          accessibilityLabel="cellar-name-input"
          testID="cellar-name-input"
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
        <Text style={styles.sectionTitle}>Feature Flags</Text>
        {featureFlagEntries.map(([key, info]) => (
          <View key={key} style={styles.flagRow}>
            <View style={styles.flagText}>
              <Text style={styles.label}>{info.label}</Text>
              <Text style={styles.hint}>{info.description}</Text>
            </View>
            <Switch
              value={settings.featureFlags[key]}
              onValueChange={(enabled) => updateFeatureFlag(key, enabled)}
            />
          </View>
        ))}
      </View>

      {isTestLocal && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testdaten</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleLoadTestData}>
            <Text style={styles.secondaryBtnText}>Testdaten laden</Text>
          </TouchableOpacity>
        </View>
      )}

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
  testBanner:  { backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 9, alignItems: "center", marginBottom: 16 },
  testBannerText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  section:     { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle:{ fontSize: 13, fontWeight: "700", color: "#8B1A1A", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  label:       { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 6 },
  value:       { fontSize: 14, color: "#888" },
  input:       { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  row:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  flagRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#eee" },
  flagText:    { flex: 1 },
  hint:        { fontSize: 12, color: "#999", marginTop: 4 },
  secondaryBtn:     { marginTop: 10, padding: 12, borderRadius: 8, backgroundColor: "#f4eaea", alignItems: "center" },
  secondaryBtnText: { color: "#8B1A1A", fontWeight: "600" },
  dangerBtn:   { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#dc2626", alignItems: "center" },
  dangerBtnText:{ color: "#dc2626", fontWeight: "600" },
});
