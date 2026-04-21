// Kellerliste — Hauptscreen
// TODO (transfer agent): implement based on src/pages/Cellar.tsx
// - Zeige alle Weine aus useWineStore (AsyncStorage-Version)
// - Suche / Filter nach Typ, Land
// - Tap auf Wein -> router.push(`/wine/${wine.id}`)
// - FlatList statt map() für Performance auf grossen Listen

import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useWineStore } from "@/store/useWineStore";
import type { Wine } from "@vinotheque/core";
import { getWineTypeLabel, getDrinkStatus } from "@vinotheque/core";

export default function CellarScreen() {
  const { wines } = useWineStore();
  const router = useRouter();

  const renderWine = ({ item }: { item: Wine }) => {
    const { label, status } = getDrinkStatus(item);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/wine/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.wineName}>{item.name}</Text>
          <Text style={styles.vintage}>{item.vintage}</Text>
        </View>
        <Text style={styles.producer}>{item.producer}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.type}>{getWineTypeLabel(item.type)}</Text>
          <Text style={styles.region}>{item.region}, {item.country}</Text>
          <Text style={[styles.drinkStatus, styles[`status_${status}`]]}>{label}</Text>
          <Text style={styles.quantity}>{item.quantity} Fl.</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* TODO (transfer agent): add search bar + filter bar here */}
      <FlatList
        data={wines}
        keyExtractor={(w) => w.id}
        renderItem={renderWine}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Noch keine Weine im Keller.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  list:      { padding: 16, gap: 12 },
  card:      { backgroundColor: "#fff", borderRadius: 12, padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  wineName:  { fontSize: 16, fontWeight: "700", color: "#1a0500", flex: 1 },
  vintage:   { fontSize: 15, fontWeight: "600", color: "#8B1A1A" },
  producer:  { fontSize: 13, color: "#666", marginBottom: 8 },
  cardFooter:{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  type:      { fontSize: 12, backgroundColor: "#f4eaea", color: "#8B1A1A", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  region:    { fontSize: 12, color: "#555" },
  quantity:  { fontSize: 12, color: "#444", fontWeight: "600", marginLeft: "auto" },
  drinkStatus:{ fontSize: 12, fontWeight: "600" },
  status_lagern:        { color: "#b45309" },
  status_trinkreif:     { color: "#16a34a" },
  status_ueberschritten:{ color: "#dc2626" },
  empty:     { textAlign: "center", color: "#aaa", marginTop: 60, fontSize: 15 },
});
