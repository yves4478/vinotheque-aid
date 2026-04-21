// Wein erfassen
// TODO (transfer agent): implement based on src/pages/AddWine.tsx
// - Alle Felder aus dem Wine-Interface (Pflichtfelder zuerst)
// - expo-image-picker für Foto
// - useWineStore.addWine() zum Speichern
// - Nach Speichern -> router.push("/(tabs)/") + Toast/Alert

import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useWineStore } from "@/store/useWineStore";
import type { Wine, WineType } from "@vinotheque/core";
import { createId, BOTTLE_SIZES } from "@vinotheque/core";

const WINE_TYPES: { value: WineType; label: string }[] = [
  { value: "rot",        label: "Rotwein" },
  { value: "weiss",      label: "Weisswein" },
  { value: "rosé",       label: "Rosé" },
  { value: "schaumwein", label: "Schaumwein" },
  { value: "dessert",    label: "Dessertwein" },
];

export default function AddWineScreen() {
  const { addWine } = useWineStore();
  const router = useRouter();

  // Formular-State (Pflichtfelder)
  const [name, setName]                 = useState("");
  const [producer, setProducer]         = useState("");
  const [vintage, setVintage]           = useState(String(new Date().getFullYear()));
  const [type, setType]                 = useState<WineType>("rot");
  const [region, setRegion]             = useState("");
  const [country, setCountry]           = useState("");
  const [grape, setGrape]               = useState("");
  const [quantity, setQuantity]         = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [drinkFrom, setDrinkFrom]       = useState(String(new Date().getFullYear()));
  const [drinkUntil, setDrinkUntil]     = useState(String(new Date().getFullYear() + 5));
  const [notes, setNotes]               = useState("");
  const [imageUri, setImageUri]         = useState<string | undefined>();

  // TODO (transfer agent): weitere Felder ergänzen (purchaseLocation, purchaseDate,
  // personalRating, isGift, isRarity, bottleSize, purchaseLink)

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  function handleSave() {
    if (!name.trim() || !producer.trim()) {
      Alert.alert("Fehler", "Name und Produzent sind Pflichtfelder.");
      return;
    }
    const wine: Wine = {
      id: createId(),
      name: name.trim(),
      producer: producer.trim(),
      vintage: Number(vintage) || new Date().getFullYear(),
      type,
      region: region.trim(),
      country: country.trim(),
      grape: grape.trim(),
      quantity: Number(quantity) || 1,
      purchasePrice: Number(purchasePrice) || 0,
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseLocation: "",
      drinkFrom: Number(drinkFrom) || new Date().getFullYear(),
      drinkUntil: Number(drinkUntil) || new Date().getFullYear() + 5,
      notes: notes.trim() || undefined,
      imageUri,
    };
    addWine(wine);
    router.push("/(tabs)/");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Weintyp-Auswahl */}
        <Text style={styles.label}>Weintyp</Text>
        <View style={styles.typeRow}>
          {WINE_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeBtn, type === t.value && styles.typeBtnActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={[styles.typeBtnText, type === t.value && styles.typeBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="z.B. Barolo Riserva" />

        <Text style={styles.label}>Produzent *</Text>
        <TextInput style={styles.input} value={producer} onChangeText={setProducer} placeholder="z.B. Giacomo Conterno" />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Jahrgang</Text>
            <TextInput style={styles.input} value={vintage} onChangeText={setVintage} keyboardType="number-pad" maxLength={4} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Anzahl Flaschen</Text>
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" />
          </View>
        </View>

        <Text style={styles.label}>Region</Text>
        <TextInput style={styles.input} value={region} onChangeText={setRegion} placeholder="z.B. Piemont" />

        <Text style={styles.label}>Land</Text>
        <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="z.B. Italien" />

        <Text style={styles.label}>Traube(n)</Text>
        <TextInput style={styles.input} value={grape} onChangeText={setGrape} placeholder="z.B. Nebbiolo" />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Trinken ab</Text>
            <TextInput style={styles.input} value={drinkFrom} onChangeText={setDrinkFrom} keyboardType="number-pad" maxLength={4} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Trinken bis</Text>
            <TextInput style={styles.input} value={drinkUntil} onChangeText={setDrinkUntil} keyboardType="number-pad" maxLength={4} />
          </View>
        </View>

        <Text style={styles.label}>Kaufpreis (CHF)</Text>
        <TextInput style={styles.input} value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" placeholder="0.00" />

        <Text style={styles.label}>Notizen</Text>
        <TextInput style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes} placeholder="Verkostungsnotizen…" multiline numberOfLines={4} />

        {/* Foto */}
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={styles.imageBtnText}>
            {imageUri ? "Foto ändern" : "Foto hinzufügen"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Wein speichern</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const WINE_RED = "#8B1A1A";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  content:   { padding: 16, paddingBottom: 40 },
  label:     { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 4, marginTop: 12 },
  input:     { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  textarea:  { height: 100, textAlignVertical: "top" },
  row:       { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  typeRow:   { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  typeBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#ccc", backgroundColor: "#fff" },
  typeBtnActive:    { backgroundColor: WINE_RED, borderColor: WINE_RED },
  typeBtnText:      { fontSize: 13, color: "#555" },
  typeBtnTextActive:{ color: "#fff", fontWeight: "600" },
  imageBtn:  { marginTop: 16, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: WINE_RED, alignItems: "center" },
  imageBtnText:{ color: WINE_RED, fontWeight: "600" },
  saveBtn:   { marginTop: 20, backgroundColor: WINE_RED, padding: 16, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
