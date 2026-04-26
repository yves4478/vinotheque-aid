import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { formatCurrencyForLocale, formatDateForLocale, formatIntegerForLocale } from "@/lib/localeFormat";
import { useWineStore } from "@/store/useWineStore";
import {
  buildVivinoWishlistItem,
  createId,
  extractImportUrl,
  fetchWineDataFromUrl,
  getPrimaryWineImage,
  getWineImages,
  getWineTypeLabel,
  isVivinoUrl,
} from "@vinotheque/core";
import type { WishlistItem } from "@vinotheque/core";

export default function WishlistScreen() {
  const { wishlist, addWishlistItem, removeWishlistItem } = useWineStore();
  const router = useRouter();
  const [vivinoInput, setVivinoInput] = useState("");
  const [importing, setImporting] = useState(false);

  async function handleVivinoImport() {
    const sourceUrl = extractImportUrl(vivinoInput);
    if (!sourceUrl) {
      Alert.alert("Vivino-Link fehlt", "Bitte füge den kopierten Vivino-Link ein.");
      return;
    }
    if (!isVivinoUrl(sourceUrl)) {
      Alert.alert("Ungültiger Link", "Bitte einen Link direkt von Vivino einfügen.");
      return;
    }

    setImporting(true);
    try {
      const data = await fetchWineDataFromUrl(sourceUrl);
      const parsed = buildVivinoWishlistItem(data, sourceUrl);
      const item: WishlistItem = {
        ...parsed,
        id: createId(),
        createdAt: new Date().toISOString(),
      };
      await addWishlistItem(item);
      setVivinoInput("");
    } catch (error) {
      Alert.alert(
        "Import fehlgeschlagen",
        error instanceof Error ? error.message : "Der Vivino-Link konnte nicht verarbeitet werden.",
      );
    } finally {
      setImporting(false);
    }
  }

  function confirmRemove(item: WishlistItem) {
    Alert.alert("Eintrag löschen", `"${item.name}" wirklich aus der Merkliste entfernen?`, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Löschen", style: "destructive", onPress: () => removeWishlistItem(item.id) },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Merkliste</Text>
          <Text style={styles.subtitle}>{formatIntegerForLocale(wishlist.length)} gemerkte Weine</Text>
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push({ pathname: "/(tabs)/add", params: { mode: "wishlist" } })}
        >
          <Text style={styles.primaryButtonText}>Hinzufügen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.importBox}>
        <Text style={styles.sectionTitle}>Vivino übernehmen</Text>
        <TextInput
          style={styles.input}
          value={vivinoInput}
          onChangeText={setVivinoInput}
          placeholder="https://www.vivino.com/…"
          autoCapitalize="none"
          keyboardType="url"
        />
        <TouchableOpacity
          style={[styles.secondaryButton, importing && styles.buttonDisabled]}
          onPress={handleVivinoImport}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color="#8B1A1A" />
          ) : (
            <Text style={styles.secondaryButtonText}>Link importieren</Text>
          )}
        </TouchableOpacity>
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Keine Merkliste-Einträge</Text>
          <Text style={styles.emptyText}>Erfasse gesehene oder getrunkene Weine direkt hier oder über den Erfassen-Tab.</Text>
        </View>
      ) : (
        wishlist.map((item) => {
          const primaryImage = getPrimaryWineImage(item);
          const imageCount = getWineImages(item).length;
          return (
          <View key={item.id} style={styles.card}>
            {primaryImage && (
              <View>
                <Image source={{ uri: primaryImage.uri }} style={styles.image} />
                {imageCount > 1 && (
                  <Text style={styles.imageCount}>{imageCount} Bilder</Text>
                )}
              </View>
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.name}>{item.name}</Text>
                  {!!item.producer && <Text style={styles.producer}>{item.producer}</Text>}
                </View>
                <TouchableOpacity onPress={() => confirmRemove(item)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>Löschen</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.metaGrid}>
                {item.source === "tasting" && <Meta label="Quelle" value="Messe-Degustation" />}
                {!!item.type && <Meta label="Typ" value={getWineTypeLabel(item.type)} />}
                {!!item.vintage && <Meta label="Jahrgang" value={String(item.vintage)} />}
                <Meta label="Datum" value={formatDateForLocale(item.tastedDate ?? item.createdAt)} />
                <Meta label="Preis" value={formatCurrencyForLocale(item.price)} />
                {!!item.region && <Meta label="Region" value={`${item.region}${item.country ? `, ${item.country}` : ""}`} />}
                {!!item.location && <Meta label="Ort" value={item.location} />}
                {!!item.occasion && <Meta label="Anlass" value={item.occasion} />}
                {!!item.companions && <Meta label="Begleitung" value={item.companions} />}
                {!!item.tastingSupplier && <Meta label="Lieferant" value={item.tastingSupplier} />}
                {!!item.tastingStand && <Meta label="Stand" value={item.tastingStand} />}
              </View>

              {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}
              {!!item.sourceUrl && (
                <TouchableOpacity onPress={() => Linking.openURL(item.sourceUrl!)} style={styles.linkButton}>
                  <Text style={styles.linkText}>Quelle öffnen</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          );
        })
      )}
    </ScrollView>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
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
  importBox: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e7ded9", padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "800", color: WINE_RED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#1a0500" },
  secondaryButton: { marginTop: 10, padding: 12, borderRadius: 9, backgroundColor: "#f4eaea", alignItems: "center" },
  secondaryButtonText: { color: WINE_RED, fontWeight: "800" },
  buttonDisabled: { opacity: 0.65 },
  emptyBox: { padding: 28, backgroundColor: "#fff", borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#e7ded9" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#1a0500" },
  emptyText: { marginTop: 6, textAlign: "center", color: "#7c706b", lineHeight: 20 },
  card: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e7ded9", marginBottom: 12, overflow: "hidden" },
  image: { width: "100%", height: 190, resizeMode: "cover", backgroundColor: "#1a0500" },
  imageCount: { position: "absolute", right: 10, bottom: 10, backgroundColor: "rgba(0,0,0,0.62)", color: "#fff", borderRadius: 8, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, fontWeight: "800" },
  cardBody: { padding: 14 },
  cardHeader: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  cardTitleWrap: { flex: 1 },
  name: { fontSize: 17, fontWeight: "900", color: "#1a0500" },
  producer: { marginTop: 2, color: "#6f625d", fontWeight: "600" },
  deleteButton: { paddingVertical: 4, paddingHorizontal: 2 },
  deleteText: { color: "#dc2626", fontWeight: "700", fontSize: 12 },
  metaGrid: { marginTop: 12, gap: 8 },
  metaItem: { flexDirection: "row", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: "#f1ece9", paddingBottom: 7 },
  metaLabel: { color: "#8a7f7a", fontSize: 12 },
  metaValue: { flex: 1, textAlign: "right", color: "#2b211e", fontWeight: "700", fontSize: 12 },
  notes: { marginTop: 12, color: "#443936", lineHeight: 20 },
  linkButton: { marginTop: 12, alignSelf: "flex-start" },
  linkText: { color: WINE_RED, fontWeight: "800" },
});
