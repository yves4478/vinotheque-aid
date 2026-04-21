// Einstellungen
// TODO (transfer agent): implement based on src/pages/Settings.tsx
// - Kellername ändern (AppSettings)
// - Umgebung prod/test umschalten
// - Daten zurücksetzen / Export

import { View, Text, TextInput, Switch, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useWineStore } from "@/store/useWineStore";

export default function SettingsScreen() {
  const { settings, updateSettings, activeEnv, setEnv, resetAll } = useWineStore();

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

  return (
    <View style={styles.container}>
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
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleReset}>
          <Text style={styles.dangerBtnText}>Alle Daten löschen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#faf8f5", padding: 16 },
  section:     { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle:{ fontSize: 13, fontWeight: "700", color: "#8B1A1A", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  label:       { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 6 },
  input:       { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  row:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hint:        { fontSize: 12, color: "#999", marginTop: 4 },
  dangerBtn:   { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#dc2626", alignItems: "center" },
  dangerBtnText:{ color: "#dc2626", fontWeight: "600" },
});
