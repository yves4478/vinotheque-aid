import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useWineStore } from "@/store/useWineStore";
import { useAppRuntime } from "@/providers/AppRuntimeProvider";
import { createId, testWines, type AppEnvironment, type RuntimeFeatureState } from "@vinotheque/core";

const ENV_LABELS: Record<AppEnvironment, { label: string; sub: string }> = {
  prod: { label: "PROD", sub: "Hetzner / Coolify" },
  dev: { label: "DEV", sub: "macOS-VM auf dem Mac" },
};

function formatSurfaceList(feature: RuntimeFeatureState) {
  return Object.entries(feature.surfaces)
    .filter(([, enabled]) => enabled)
    .map(([surface]) => surface.toUpperCase())
    .join(" / ");
}

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    activeEnv,
    isDevEnvironment,
    resetAll,
    wines,
    wishlist,
    shopping,
    addWine,
  } = useWineStore();
  const { environment, features, surface } = useAppRuntime();
  const env = ENV_LABELS[environment];

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

  async function loadSampleData() {
    for (const wine of testWines) {
      await addWine({ ...wine, id: createId() });
    }
  }

  async function handleLoadSampleData() {
    if (wines.length > 0) {
      Alert.alert("Hinweis", "Es sind bereits Weine vorhanden. Demodaten trotzdem laden?", [
        { text: "Abbrechen", style: "cancel" },
        { text: "Laden", onPress: loadSampleData },
      ]);
      return;
    }

    await loadSampleData();
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
      <View style={[styles.section, styles.runtimeBadge]}>
        <Text style={styles.runtimeLabel}>Umgebung {env.label}</Text>
        <Text style={styles.runtimeSub}>{env.sub}</Text>
        <Text style={styles.runtimeMeta}>Surface {surface.toUpperCase()} · Storage {activeEnv.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Keller</Text>
        <Text style={styles.label}>Kellername</Text>
        <TextInput
          style={styles.input}
          value={settings.cellarName}
          onChangeText={(value) => updateSettings({ cellarName: value })}
          accessibilityLabel="cellar-name-input"
          testID="cellar-name-input"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>KI-Integration</Text>
        <Text style={styles.label}>Anthropic API-Key</Text>
        <TextInput
          style={styles.input}
          value={settings.anthropicApiKey ?? ""}
          onChangeText={(value) => updateSettings({ anthropicApiKey: value || undefined })}
          placeholder="sk-ant-..."
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Text style={styles.hint}>
          Wird lokal auf dem Gerät gespeichert und direkt für den optionalen Etiketten-Scan mit Claude Vision verwendet.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feature-Rollout</Text>
        <Text style={styles.hint}>
          Sichtbar werden standardmaessig nur Features, die ueber iOS, PWA, Web und Backend freigegeben sind.
          Geschaltet werden sie zentral in den Einstellungen der Web-App.
        </Text>
        <View style={styles.featureList}>
          {features.map((feature) => (
            <View key={feature.key} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureTitle}>{feature.label}</Text>
                <Text style={feature.enabled ? styles.featureEnabled : styles.featureDisabled}>
                  {feature.enabled ? "aktiv" : "geparkt"}
                </Text>
              </View>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              <Text style={styles.featureMeta}>Surfaces: {formatSurfaceList(feature)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{Constants.expoConfig?.version ?? "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Runtime</Text>
          <Text style={styles.value}>{environment.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daten</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleExport}>
          <Text style={styles.secondaryBtnText}>Daten exportieren (JSON)</Text>
        </TouchableOpacity>
      </View>

      {isDevEnvironment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEV-Werkzeuge</Text>
          <Text style={styles.hint}>
            Nur in DEV sichtbar. Damit koennen wir Features vorbereiten und Demodaten laden, ohne PROD zu beruehren.
          </Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleLoadSampleData}>
            <Text style={styles.secondaryBtnText}>300 Demoweine laden</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleReset}>
          <Text style={styles.dangerBtnText}>
            {isDevEnvironment ? "Alle DEV-Daten löschen" : "Alle Daten löschen"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  content: { padding: 16, paddingBottom: 32 },
  section: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  runtimeBadge: { backgroundColor: "#fef3c7", borderWidth: 1, borderColor: "#fcd34d" },
  runtimeLabel: { fontSize: 18, fontWeight: "700", color: "#92400e" },
  runtimeSub: { fontSize: 13, color: "#a16207", marginTop: 4 },
  runtimeMeta: { fontSize: 12, color: "#92400e", marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#8B1A1A", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 6 },
  value: { fontSize: 14, color: "#888" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  hint: { fontSize: 12, color: "#999", marginTop: 4, lineHeight: 18 },
  secondaryBtn: { marginTop: 10, padding: 12, borderRadius: 8, backgroundColor: "#f4eaea", alignItems: "center" },
  secondaryBtnText: { color: "#8B1A1A", fontWeight: "600" },
  dangerBtn: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#dc2626", alignItems: "center" },
  dangerBtnText: { color: "#dc2626", fontWeight: "600" },
  featureList: { gap: 12 },
  featureCard: { borderRadius: 10, borderWidth: 1, borderColor: "#eadfd8", padding: 12, backgroundColor: "#fcfbfa" },
  featureHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  featureTitle: { fontSize: 15, fontWeight: "700", color: "#3f2b24", flex: 1 },
  featureDescription: { fontSize: 13, color: "#6b5b54", marginTop: 6, lineHeight: 18 },
  featureMeta: { fontSize: 12, color: "#8b7c75", marginTop: 8 },
  featureEnabled: { fontSize: 12, fontWeight: "700", color: "#047857" },
  featureDisabled: { fontSize: 12, fontWeight: "700", color: "#b45309" },
});
