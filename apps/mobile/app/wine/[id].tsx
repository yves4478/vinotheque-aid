// Weindetail & Bearbeiten

import { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import {
  formatCurrencyForLocale,
  formatDateForLocale,
  formatIntegerForLocale,
  parseDateInput,
  parseLocaleNumber,
} from "@/lib/localeFormat";
import { useWineStore } from "@/store/useWineStore";
import { buildWineInsight, createId, createWineImage, getPrimaryWineImage, getWineImages, getWineTypeLabel, getDrinkStatus } from "@vinotheque/core";
import type { Wine, WineType } from "@vinotheque/core";

const WINE_TYPES: { value: WineType; label: string }[] = [
  { value: "rot", label: "Rot" },
  { value: "weiss", label: "Weiss" },
  { value: "rosé", label: "Rosé" },
  { value: "schaumwein", label: "Schaumwein" },
  { value: "dessert", label: "Dessert" },
];

export default function WineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { wines, loaded, removeWine, updateWine, consumeWine, addShoppingItem } = useWineStore();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Wine | null>(null);

  const wine = wines.find((w) => w.id === id);

  useEffect(() => {
    if (wine && !editing) setDraft(wine);
  }, [wine, editing]);

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#8B1A1A" />
      </View>
    );
  }

  if (!wine) {
    return (
      <View style={styles.center}>
        <Text>Wein nicht gefunden.</Text>
      </View>
    );
  }

  const current = editing && draft ? draft : wine;
  const { label: drinkLabel, status } = getDrinkStatus(current);
  const images = getWineImages(current);
  const insight = buildWineInsight(current);

  function updateDraft(patch: Partial<Wine>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function saveImageLocally(uri: string): Promise<string> {
    const filename = `wine_${Date.now()}.jpg`;
    if (!FileSystem.documentDirectory) {
      throw new Error("Expo document directory is not available.");
    }
    const dest = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  }

  function setImages(nextImages: Wine["images"]) {
    const normalized = (nextImages ?? [])
      .slice(0, 3)
      .map((image, index) => ({ ...image, isPrimary: nextImages?.some((candidate) => candidate.isPrimary) ? image.isPrimary : index === 0 }));
    const primary = getPrimaryWineImage({ images: normalized });
    updateDraft({ images: normalized, imageUri: primary?.uri });
  }

  async function addImage(source: "camera" | "library") {
    if (images.length >= 3) {
      Alert.alert("Maximal 3 Bilder", "Pro Wein koennen bis zu drei Bilder gespeichert werden.");
      return;
    }

    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Kamera nicht freigegeben", "Bitte erlaube den Kamerazugriff, um Etiketten zu fotografieren.");
        return;
      }
    }

    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.75 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.75 });

    if (!result.canceled) {
      const localUri = await saveImageLocally(result.assets[0].uri);
      const next = [
        ...images,
        createWineImage(localUri, images.length === 0 ? "Flasche" : "Etikett", images.length === 0),
      ];
      setImages(next);
    }
  }

  function removeImage(imageId: string) {
    setImages(images
      .filter((image) => image.id !== imageId)
      .map((image, index) => ({ ...image, isPrimary: index === 0 })));
  }

  function makePrimaryImage(imageId: string) {
    setImages(images.map((image) => ({ ...image, isPrimary: image.id === imageId })));
  }

  async function handleSave() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.producer.trim()) {
      Alert.alert("Fehler", "Name und Produzent sind Pflichtfelder.");
      return;
    }

    const draftImages = getWineImages(draft);
    const primaryImage = getPrimaryWineImage({ images: draftImages });
    await updateWine({
      ...draft,
      name: draft.name.trim(),
      producer: draft.producer.trim(),
      region: draft.region.trim(),
      country: draft.country.trim(),
      grape: draft.grape.trim(),
      purchaseLocation: draft.purchaseLocation.trim(),
      storageLocation: draft.storageLocation?.trim() || undefined,
      purchaseDate: parseDateInput(draft.purchaseDate) ?? draft.purchaseDate.trim(),
      notes: draft.notes?.trim() || undefined,
      images: draftImages,
      imageUri: primaryImage?.uri,
      purchaseLink: draft.purchaseLink?.trim() || undefined,
      giftFrom: draft.isGift ? draft.giftFrom?.trim() || undefined : undefined,
    });
    setEditing(false);
  }

  async function adjustQuantity(delta: number) {
    const nextQuantity = current.quantity + delta;
    if (nextQuantity < 1) return;
    const nextWine = { ...current, quantity: nextQuantity };
    setDraft(nextWine);
    await updateWine(nextWine);
  }

  async function handleConsume() {
    await consumeWine(current.id);
    if (current.quantity <= 1) router.back();
  }

  function handleDelete() {
    Alert.alert("Wein löschen", `"${current.name}" wirklich löschen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen", style: "destructive",
        onPress: async () => { await removeWine(current.id); router.back(); },
      },
    ]);
  }

  async function handleAddToShopping() {
    await addShoppingItem({
      id: createId(),
      name: current.name,
      producer: current.producer,
      quantity: 1,
      estimatedPrice: current.purchasePrice || 0,
      reason: "Nachkaufen",
      checked: false,
    });
    Alert.alert("Auf Einkaufsliste", `"${current.name}" wurde zur Einkaufsliste hinzugefügt.`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: editing ? "Wein bearbeiten" : current.name,
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={editing ? handleSave : () => {
                setDraft({ ...wine, purchaseDate: formatDateForLocale(wine.purchaseDate) });
                setEditing(true);
              }}
            >
              <Text style={styles.headerButtonText}>{editing ? "Speichern" : "Bearbeiten"}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {(images.length > 0 || editing) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bilder ({images.length}/3)</Text>
          {images.length > 0 && (
            <View style={styles.imageGrid}>
              {images.map((image) => (
                <View key={image.id} style={styles.imageTile}>
                  <Image source={{ uri: image.uri }} style={styles.image} resizeMode="cover" />
                  {editing && (
                    <View style={styles.imageActions}>
                      <TouchableOpacity style={[styles.imagePill, image.isPrimary && styles.imagePillActive]} onPress={() => makePrimaryImage(image.id)}>
                        <Text style={[styles.imagePillText, image.isPrimary && styles.imagePillTextActive]}>
                          {image.isPrimary ? "Hauptbild" : "Haupt"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.imagePill} onPress={() => removeImage(image.id)}>
                        <Text style={styles.imagePillText}>Entfernen</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
          {editing && images.length < 3 && (
            <View style={styles.photoRow}>
              <TouchableOpacity style={styles.imageBtn} onPress={() => addImage("camera")}>
                <Text style={styles.imageBtnText}>Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageBtn} onPress={() => addImage("library")}>
                <Text style={styles.imageBtnText}>Mediathek</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {editing ? (
        <>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={current.name}
            onChangeText={(value) => updateDraft({ name: value })}
          />
          <Text style={styles.label}>Produzent</Text>
          <TextInput
            style={styles.input}
            value={current.producer}
            onChangeText={(value) => updateDraft({ producer: value })}
          />
        </>
      ) : (
        <>
          <Text style={styles.name}>{current.name}</Text>
          <Text style={styles.producer}>{current.producer}</Text>
        </>
      )}

      <View style={styles.badges}>
        <Text style={styles.badge}>{getWineTypeLabel(current.type)}</Text>
        <Text style={styles.badge}>{current.vintage}</Text>
        <Text style={[styles.badge, styles[`status_${status}`]]}>{drinkLabel}</Text>
      </View>

      {editing && (
        <View style={styles.typeRow}>
          {WINE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeBtn, current.type === type.value && styles.typeBtnActive]}
              onPress={() => updateDraft({ type: type.value })}
            >
              <Text style={[styles.typeBtnText, current.type === type.value && styles.typeBtnTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        {editing ? (
          <>
            <EditableRow label="Jahrgang" value={String(current.vintage)} onChangeText={(value) => updateDraft({ vintage: Number(value) || current.vintage })} keyboardType="number-pad" />
            <EditableRow label="Region" value={current.region} onChangeText={(value) => updateDraft({ region: value })} />
            <EditableRow label="Land" value={current.country} onChangeText={(value) => updateDraft({ country: value })} />
            <EditableRow label="Traube" value={current.grape} onChangeText={(value) => updateDraft({ grape: value })} />
            <EditableRow label="Anzahl" value={String(current.quantity)} onChangeText={(value) => updateDraft({ quantity: Number(value) || current.quantity })} keyboardType="number-pad" />
            <EditableRow label="Kaufpreis" value={String(current.purchasePrice)} onChangeText={(value) => updateDraft({ purchasePrice: parseLocaleNumber(value) })} keyboardType="decimal-pad" />
            <EditableRow label="Kaufort" value={current.purchaseLocation} onChangeText={(value) => updateDraft({ purchaseLocation: value })} />
            <EditableRow label="Lagerort" value={current.storageLocation ?? ""} onChangeText={(value) => updateDraft({ storageLocation: value || undefined })} />
            <EditableRow label="Kaufdatum" value={current.purchaseDate} onChangeText={(value) => updateDraft({ purchaseDate: value })} />
            <EditableRow label="Trinken ab" value={String(current.drinkFrom)} onChangeText={(value) => updateDraft({ drinkFrom: Number(value) || current.drinkFrom })} keyboardType="number-pad" />
            <EditableRow label="Trinken bis" value={String(current.drinkUntil)} onChangeText={(value) => updateDraft({ drinkUntil: Number(value) || current.drinkUntil })} keyboardType="number-pad" />
            <EditableRow label="Bewertung" value={String(current.rating ?? "")} onChangeText={(value) => updateDraft({ rating: value ? Number(value) : undefined })} keyboardType="number-pad" />
            <EditableRow label="Persönlich" value={String(current.personalRating ?? "")} onChangeText={(value) => updateDraft({ personalRating: value ? Number(value) : undefined })} keyboardType="number-pad" />
            <EditableSwitchRow label="Geschenk" value={!!current.isGift} onValueChange={(value) => updateDraft({ isGift: value, giftFrom: value ? current.giftFrom : undefined })} />
            <EditableSwitchRow label="Rarität" value={!!current.isRarity} onValueChange={(value) => updateDraft({ isRarity: value })} />
            <EditableRow label="Flaschengrösse" value={current.bottleSize ?? ""} onChangeText={(value) => updateDraft({ bottleSize: value || undefined })} />
            {current.isGift && <EditableRow label="Geschenk von" value={current.giftFrom ?? ""} onChangeText={(value) => updateDraft({ giftFrom: value || undefined })} />}
            <EditableRow label="Kauflink" value={current.purchaseLink ?? ""} onChangeText={(value) => updateDraft({ purchaseLink: value || undefined })} keyboardType="url" />
          </>
        ) : (
          <>
            <Row label="Region" value={`${current.region}, ${current.country}`} />
            <Row label="Traube" value={current.grape} />
            <Row label="Anzahl" value={`${formatIntegerForLocale(current.quantity)} Flasche(n)`} />
            <Row label="Kaufpreis" value={formatCurrencyForLocale(current.purchasePrice)} />
            <Row label="Kaufort" value={current.purchaseLocation || "-"} />
            <Row label="Lagerort" value={current.storageLocation || "-"} />
            <Row label="Kaufdatum" value={formatDateForLocale(current.purchaseDate)} />
            <Row label="Trinken" value={`${current.drinkFrom} - ${current.drinkUntil}`} />
            {current.rating && <Row label="Bewertung" value={`${current.rating} / 100`} />}
            {current.personalRating && <Row label="Persönlich" value={`${current.personalRating} / 5`} />}
            {current.bottleSize && <Row label="Flaschengrösse" value={current.bottleSize} />}
            {current.isGift && <Row label="Geschenk" value={current.giftFrom || "Ja"} />}
            {current.isRarity && <Row label="Rarität" value="Ja" />}
            {current.purchaseLink && <Row label="Kauflink" value={current.purchaseLink} />}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flaschen</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => adjustQuantity(-1)}
            accessibilityLabel="Flaschenzahl verringern"
            testID="quantity-decrease-button"
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{formatIntegerForLocale(current.quantity)}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => adjustQuantity(1)}
            accessibilityLabel="Flaschenzahl erhöhen"
            testID="quantity-increase-button"
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {(editing || current.notes) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notizen</Text>
          {editing ? (
            <TextInput
              style={[styles.input, styles.textarea]}
              value={current.notes ?? ""}
              onChangeText={(value) => updateDraft({ notes: value })}
              multiline
            />
          ) : (
            <Text style={styles.notes}>{current.notes}</Text>
          )}
        </View>
      )}

      {!editing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zusatzinfos</Text>
          <Text style={styles.insightText}>{insight.summary}</Text>
          <View style={styles.factList}>
            {insight.facts.slice(0, 4).map((fact) => (
              <Text key={fact} style={styles.factText}>{fact}</Text>
            ))}
          </View>
          <TouchableOpacity style={styles.insightButton} onPress={() => Linking.openURL(insight.searchUrl)}>
            <Text style={styles.insightButtonText}>Websuche öffnen</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.consumeBtn} onPress={handleConsume}>
        <Text style={styles.consumeBtnText}>Als getrunken markieren</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shoppingBtn} onPress={handleAddToShopping}>
        <Text style={styles.shoppingBtnText}>Auf Einkaufsliste setzen</Text>
      </TouchableOpacity>

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

function EditableRow({
  label,
  value,
  onChangeText,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "number-pad" | "decimal-pad" | "url";
}) {
  return (
    <View style={styles.editRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        style={styles.rowInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "url" ? "none" : "sentences"}
      />
    </View>
  );
}

function EditableSwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? "#8B1A1A" : "#f4f4f5"}
        trackColor={{ false: "#d6d1cf", true: "#c58b8b" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: "#faf8f5" },
  content:     { padding: 20, paddingBottom: 40 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  headerButton: { paddingVertical: 6, paddingHorizontal: 4 },
  headerButtonText: { color: "#8B1A1A", fontSize: 14, fontWeight: "700" },
  imageGrid:   { gap: 10 },
  imageTile:   { borderRadius: 12, overflow: "hidden", backgroundColor: "#1a0500", marginBottom: 10 },
  image:       { width: "100%", height: 220 },
  imageActions:{ flexDirection: "row", gap: 8, padding: 8, backgroundColor: "#fff" },
  imagePill:   { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center", backgroundColor: "#f4eaea" },
  imagePillActive: { backgroundColor: "#8B1A1A" },
  imagePillText: { color: "#8B1A1A", fontWeight: "800", fontSize: 12 },
  imagePillTextActive: { color: "#fff" },
  photoRow:    { flexDirection: "row", gap: 10 },
  imageBtn:    { flex: 1, borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#8B1A1A", backgroundColor: "#fff" },
  imageBtnText:{ color: "#8B1A1A", fontWeight: "800" },
  name:        { fontSize: 22, fontWeight: "800", color: "#1a0500" },
  producer:    { fontSize: 15, color: "#666", marginTop: 2, marginBottom: 12 },
  badges:      { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#f4eaea", color: "#8B1A1A", borderRadius: 20, fontSize: 13, fontWeight: "600" },
  status_lagern:         { backgroundColor: "#fef3c7", color: "#b45309" },
  status_trinkreif:      { backgroundColor: "#dcfce7", color: "#16a34a" },
  status_ueberschritten: { backgroundColor: "#fee2e2", color: "#dc2626" },
  section:     { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle:{ fontSize: 13, fontWeight: "700", color: "#8B1A1A", marginBottom: 8 },
  label:       { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 4, marginTop: 10 },
  input:       { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  textarea:    { minHeight: 100, textAlignVertical: "top" },
  typeRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  typeBtn:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: "#ccc", backgroundColor: "#fff" },
  typeBtnActive: { backgroundColor: "#8B1A1A", borderColor: "#8B1A1A" },
  typeBtnText: { fontSize: 13, color: "#555", fontWeight: "600" },
  typeBtnTextActive: { color: "#fff" },
  row:         { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f0eded" },
  rowLabel:    { fontSize: 14, color: "#888" },
  rowValue:    { fontSize: 14, fontWeight: "600", color: "#222", flex: 1, textAlign: "right", marginLeft: 12 },
  editRow:     { paddingVertical: 6 },
  rowInput:    { backgroundColor: "#faf8f5", borderWidth: 1, borderColor: "#e2d8d4", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginTop: 4, fontSize: 14, color: "#222" },
  switchRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  quantityButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#8B1A1A", alignItems: "center", justifyContent: "center" },
  quantityButtonText: { fontSize: 24, color: "#8B1A1A", fontWeight: "700" },
  quantityValue: { minWidth: 40, textAlign: "center", fontSize: 20, fontWeight: "800", color: "#1a0500" },
  notes:       { fontSize: 14, color: "#444", lineHeight: 21 },
  insightText: { color: "#443936", lineHeight: 20 },
  factList:    { marginTop: 10, gap: 4 },
  factText:    { color: "#6f625d", fontSize: 12, fontWeight: "600" },
  insightButton: { marginTop: 12, padding: 12, borderRadius: 9, backgroundColor: "#f4eaea", alignItems: "center" },
  insightButtonText: { color: "#8B1A1A", fontWeight: "800" },
  consumeBtn:  { marginTop: 4, padding: 14, borderRadius: 10, backgroundColor: "#8B1A1A", alignItems: "center" },
  consumeBtnText: { color: "#fff", fontWeight: "700" },
  shoppingBtn: { marginTop: 12, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#8B1A1A", alignItems: "center" },
  shoppingBtnText: { color: "#8B1A1A", fontWeight: "700" },
  deleteBtn:   { marginTop: 16, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#dc2626", alignItems: "center" },
  deleteBtnText: { color: "#dc2626", fontWeight: "600" },
});
