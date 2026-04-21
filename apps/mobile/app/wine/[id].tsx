// Weindetail & Bearbeiten

import { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useWineStore } from "@/store/useWineStore";
import { getWineTypeLabel, getDrinkStatus } from "@vinotheque/core";
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
  const { wines, loaded, removeWine, updateWine, consumeWine } = useWineStore();
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

  function updateDraft(patch: Partial<Wine>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function handleSave() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.producer.trim()) {
      Alert.alert("Fehler", "Name und Produzent sind Pflichtfelder.");
      return;
    }

    await updateWine({
      ...draft,
      name: draft.name.trim(),
      producer: draft.producer.trim(),
      region: draft.region.trim(),
      country: draft.country.trim(),
      grape: draft.grape.trim(),
      purchaseLocation: draft.purchaseLocation.trim(),
      purchaseDate: draft.purchaseDate.trim(),
      notes: draft.notes?.trim() || undefined,
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: editing ? "Wein bearbeiten" : current.name,
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={editing ? handleSave : () => {
                setDraft(wine);
                setEditing(true);
              }}
            >
              <Text style={styles.headerButtonText}>{editing ? "Speichern" : "Bearbeiten"}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {current.imageUri && (
        <Image
          source={{ uri: current.imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
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
            <EditableRow label="Kaufpreis" value={String(current.purchasePrice)} onChangeText={(value) => updateDraft({ purchasePrice: Number(value) || 0 })} keyboardType="decimal-pad" />
            <EditableRow label="Kaufort" value={current.purchaseLocation} onChangeText={(value) => updateDraft({ purchaseLocation: value })} />
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
            <Row label="Anzahl" value={`${current.quantity} Flasche(n)`} />
            <Row label="Kaufpreis" value={current.purchasePrice ? `CHF ${current.purchasePrice.toFixed(2)}` : "-"} />
            <Row label="Kaufort" value={current.purchaseLocation || "-"} />
            <Row label="Kaufdatum" value={current.purchaseDate || "-"} />
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
          <TouchableOpacity style={styles.quantityButton} onPress={() => adjustQuantity(-1)} accessibilityLabel="Flaschenzahl verringern">
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{current.quantity}</Text>
          <TouchableOpacity style={styles.quantityButton} onPress={() => adjustQuantity(1)} accessibilityLabel="Flaschenzahl erhöhen">
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

      <TouchableOpacity style={styles.consumeBtn} onPress={handleConsume}>
        <Text style={styles.consumeBtnText}>Als getrunken markieren</Text>
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
  image:       { width: "100%", height: 240, borderRadius: 12, marginBottom: 16 },
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
  consumeBtn:  { marginTop: 4, padding: 14, borderRadius: 10, backgroundColor: "#8B1A1A", alignItems: "center" },
  consumeBtnText: { color: "#fff", fontWeight: "700" },
  deleteBtn:   { marginTop: 16, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#dc2626", alignItems: "center" },
  deleteBtnText: { color: "#dc2626", fontWeight: "600" },
});
