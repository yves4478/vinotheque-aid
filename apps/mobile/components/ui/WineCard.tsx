// Wiederverwendbare WineCard-Komponente
// TODO (transfer agent): kann hier verfeinert werden (Foto-Thumbnail, Sternebewertung, etc.)

import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { formatIntegerForLocale } from "@/lib/localeFormat";
import type { Wine } from "@vinotheque/core";
import { getWineTypeLabel, getDrinkStatus } from "@vinotheque/core";

interface Props {
  wine: Wine;
  onPress: () => void;
}

export function WineCard({ wine, onPress }: Props) {
  const { label, status } = getDrinkStatus(wine);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {wine.imageUri && (
        <Image source={{ uri: wine.imageUri }} style={styles.image} />
      )}
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{wine.name}</Text>
          <Text style={styles.vintage}>{wine.vintage}</Text>
        </View>
        <Text style={styles.producer} numberOfLines={1}>{wine.producer}</Text>
        <View style={styles.footer}>
          <Text style={styles.type}>{getWineTypeLabel(wine.type)}</Text>
          <Text style={[styles.status, styles[`status_${status}`]]}>{label}</Text>
          <Text style={styles.qty}>{formatIntegerForLocale(wine.quantity)} Fl.</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:    { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, marginBottom: 10, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  image:   { width: 72, height: 90, resizeMode: "cover" },
  body:    { flex: 1, padding: 12 },
  header:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name:    { fontSize: 15, fontWeight: "700", color: "#1a0500", flex: 1, marginRight: 8 },
  vintage: { fontSize: 14, fontWeight: "600", color: "#8B1A1A" },
  producer:{ fontSize: 12, color: "#777", marginTop: 2, marginBottom: 8 },
  footer:  { flexDirection: "row", alignItems: "center", gap: 8 },
  type:    { fontSize: 11, backgroundColor: "#f4eaea", color: "#8B1A1A", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  status:  { fontSize: 11, fontWeight: "600" },
  status_lagern:         { color: "#b45309" },
  status_trinkreif:      { color: "#16a34a" },
  status_ueberschritten: { color: "#dc2626" },
  qty:     { fontSize: 12, color: "#555", fontWeight: "600", marginLeft: "auto" },
});
