// Weindetail & Bearbeiten
// TODO (transfer agent): implement based on src/pages/Cellar.tsx (Detail-Ansicht)
// - Alle Wine-Felder anzeigen
// - Edit-Modus via State-Toggle
// - Flaschenzahl anpassen (+/- Buttons)
// - Als getrunken markieren -> useWineStore.consumeWine()
// - Löschen -> useWineStore.removeWine() + router.back()

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWineStore } from "@/store/useWineStore";
import { getWineTypeLabel, getDrinkStatus } from "@vinotheque/core";

export default function WineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wines, removeWine } = useWineStore();
  const router = useRouter();

  const wine = wines.find((w) => w.id === id);

  if (!wine) {
    return (
      <View style={styles.center}>
        <Text>Wein nicht gefunden.</Text>
      </View>
    );
  }

  const { label: drinkLabel, status } = getDrinkStatus(wine);

  function handleDelete() {
    Alert.alert("Wein löschen", `"${wine!.name}" wirklich löschen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen", style: "destructive",
        onPress: () => { removeWine(wine!.id); router.back(); },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{wine.name}</Text>
      <Text style={styles.producer}>{wine.producer}</Text>

      <View style={styles.badges}>
        <Text style={styles.badge}>{getWineTypeLabel(wine.type)}</Text>
        <Text style={styles.badge}>{wine.vintage}</Text>
        <Text style={[styles.badge, styles[`status_${status}`]]}>{drinkLabel}</Text>
      </View>

      <View style={styles.section}>
        <Row label="Region" value={`${wine.region}, ${wine.country}`} />
        <Row label="Traube" value={wine.grape} />
        <Row label="Anzahl" value={`${wine.quantity} Flasche(n)`} />
        <Row label="Kaufpreis" value={wine.purchasePrice ? `CHF ${wine.purchasePrice.toFixed(2)}` : "—"} />
        <Row label="Trinken" value={`${wine.drinkFrom} – ${wine.drinkUntil}`} />
        {wine.rating && <Row label="Bewertung" value={`${wine.rating} / 100`} />}
      </View>

      {wine.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notizen</Text>
          <Text style={styles.notes}>{wine.notes}</Text>
        </View>
      )}

      {/* TODO (transfer agent): Image anzeigen wenn wine.imageUri gesetzt */}

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Wein löschen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#faf8f5" },
  content:     { padding: 20, paddingBottom: 40 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  name:        { fontSize: 22, fontWeight: "800", color: "#1a0500" },
  producer:    { fontSize: 15, color: "#666", marginTop: 2, marginBottom: 12 },
  badges:      { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#f4eaea", color: "#8B1A1A", borderRadius: 20, fontSize: 13, fontWeight: "600" },
  status_lagern:         { backgroundColor: "#fef3c7", color: "#b45309" },
  status_trinkreif:      { backgroundColor: "#dcfce7", color: "#16a34a" },
  status_ueberschritten: { backgroundColor: "#fee2e2", color: "#dc2626" },
  section:     { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle:{ fontSize: 13, fontWeight: "700", color: "#8B1A1A", marginBottom: 8 },
  row:         { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f0eded" },
  rowLabel:    { fontSize: 14, color: "#888" },
  rowValue:    { fontSize: 14, fontWeight: "600", color: "#222" },
  notes:       { fontSize: 14, color: "#444", lineHeight: 21 },
  deleteBtn:   { marginTop: 16, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#dc2626", alignItems: "center" },
  deleteBtnText: { color: "#dc2626", fontWeight: "600" },
});
