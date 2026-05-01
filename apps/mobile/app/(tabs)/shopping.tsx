import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { formatCurrencyForLocale, formatIntegerForLocale } from "@/lib/localeFormat";
import { useWineStore } from "@/store/useWineStore";
import type { ShoppingItem } from "@vinotheque/core";

export default function ShoppingScreen() {
  const { shopping, toggleShoppingItem, removeShoppingItem, settings } = useWineStore();
  const router = useRouter();
  const openItems = shopping.filter((item) => !item.checked);
  const doneItems = shopping.filter((item) => item.checked);
  const totalEstimate = openItems.reduce((sum, item) => sum + item.quantity * item.estimatedPrice, 0);

  function confirmRemove(item: ShoppingItem) {
    Alert.alert("Eintrag löschen", `"${item.name}" wirklich entfernen?`, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Löschen", style: "destructive", onPress: () => removeShoppingItem(item.id) },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Einkaufsliste</Text>
          <Text style={styles.subtitle}>
            {formatIntegerForLocale(openItems.length)} offen · ca. {formatCurrencyForLocale(totalEstimate, settings.currency)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push({ pathname: "/(tabs)/add", params: { mode: "shopping" } })}
        >
          <Text style={styles.primaryButtonText}>Hinzufügen</Text>
        </TouchableOpacity>
      </View>

      {openItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Keine offenen Einkäufe</Text>
          <Text style={styles.emptyText}>Füge Weine über den Erfassen-Tab direkt zur Einkaufsliste hinzu.</Text>
        </View>
      ) : (
        openItems.map((item) => (
          <ShoppingRow
            key={item.id}
            item={item}
            onToggle={() => toggleShoppingItem(item.id)}
            onRemove={() => confirmRemove(item)}
            currency={settings.currency}
          />
        ))
      )}

      {doneItems.length > 0 && (
        <View style={styles.doneSection}>
          <Text style={styles.sectionTitle}>Erledigt</Text>
          {doneItems.map((item) => (
            <ShoppingRow
              key={item.id}
              item={item}
              done
              onToggle={() => toggleShoppingItem(item.id)}
              onRemove={() => confirmRemove(item)}
              currency={settings.currency}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ShoppingRow({
  item,
  done = false,
  onToggle,
  onRemove,
  currency,
}: {
  item: ShoppingItem;
  done?: boolean;
  onToggle: () => void;
  onRemove: () => void;
  currency: string;
}) {
  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <TouchableOpacity
        style={[styles.checkbox, done && styles.checkboxDone]}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
      >
        {done && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <View style={styles.cardBody}>
        <Text style={[styles.name, done && styles.doneText]}>{item.name}</Text>
        <Text style={styles.producer}>{item.producer}</Text>
        {!!item.reason && <Text style={styles.reason}>{item.reason}</Text>}
      </View>
      <View style={styles.priceBox}>
        <Text style={styles.quantity}>{formatIntegerForLocale(item.quantity)}×</Text>
        <Text style={styles.price}>{formatCurrencyForLocale(item.estimatedPrice, currency)}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.deleteButton}>
        <Text style={styles.deleteText}>Löschen</Text>
      </TouchableOpacity>
    </View>
  );
}

const WINE_RED = "#8B1A1A";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "900", color: "#1a0500" },
  subtitle: { color: "#7c706b", marginTop: 2 },
  primaryButton: { backgroundColor: WINE_RED, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  primaryButtonText: { color: "#fff", fontWeight: "800" },
  emptyBox: { padding: 28, backgroundColor: "#fff", borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#e7ded9" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#1a0500" },
  emptyText: { marginTop: 6, textAlign: "center", color: "#7c706b", lineHeight: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: WINE_RED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  doneSection: { marginTop: 22 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e7ded9",
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardDone: { opacity: 0.55 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: "#d9cfca", alignItems: "center", justifyContent: "center" },
  checkboxDone: { backgroundColor: WINE_RED, borderColor: WINE_RED },
  checkmark: { color: "#fff", fontWeight: "900" },
  cardBody: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: "900", color: "#1a0500" },
  doneText: { textDecorationLine: "line-through" },
  producer: { color: "#6f625d", marginTop: 2, fontSize: 12 },
  reason: { color: "#a26f27", marginTop: 4, fontSize: 12, fontWeight: "700" },
  priceBox: { alignItems: "flex-end" },
  quantity: { color: "#1a0500", fontWeight: "900" },
  price: { color: "#7c706b", fontSize: 12, marginTop: 2 },
  deleteButton: { paddingVertical: 4 },
  deleteText: { color: "#dc2626", fontWeight: "700", fontSize: 12 },
});
