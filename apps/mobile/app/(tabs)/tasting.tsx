import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createId, createWineImage, getPrimaryWineImage } from "@vinotheque/core";
import type { WineImage, WishlistItem } from "@vinotheque/core";
import { toIsoDate } from "@/lib/localeFormat";
import { useWineStore } from "@/store/useWineStore";

const WINE_RED = "#8B1A1A";

export default function TastingScreen() {
  const { addWishlistItem } = useWineStore();
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [stand, setStand] = useState("");
  const [wineName, setWineName] = useState("");
  const [rating, setRating] = useState<number | undefined>();
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<WineImage[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  async function saveImageLocally(uri: string): Promise<string> {
    const filename = `tasting_${Date.now()}.jpg`;
    if (!FileSystem.documentDirectory) {
      throw new Error("Expo document directory is not available.");
    }
    const dest = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  }

  function appendImage(uri: string, label: WineImage["label"]) {
    setImages((current) => {
      if (current.length >= 3) {
        Alert.alert("Maximal 3 Bilder", "Pro Degu-Eintrag koennen bis zu drei Bilder gespeichert werden.");
        return current;
      }
      return [...current, createWineImage(uri, label, current.length === 0)];
    });
  }

  async function captureImage(label: WineImage["label"]) {
    if (images.length >= 3) {
      Alert.alert("Maximal 3 Bilder", "Pro Degu-Eintrag koennen bis zu drei Bilder gespeichert werden.");
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Kamera nicht freigegeben", "Bitte erlaube den Kamerazugriff fuer Messefotos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.75,
    });
    if (!result.canceled) {
      appendImage(await saveImageLocally(result.assets[0].uri), label);
    }
  }

  async function pickImage() {
    if (images.length >= 3) {
      Alert.alert("Maximal 3 Bilder", "Pro Degu-Eintrag koennen bis zu drei Bilder gespeichert werden.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.75,
    });
    if (!result.canceled) {
      appendImage(await saveImageLocally(result.assets[0].uri), images.length === 0 ? "Flasche" : "Notiz");
    }
  }

  function removeImage(imageId: string) {
    setImages((current) => current
      .filter((image) => image.id !== imageId)
      .map((image, index) => ({ ...image, isPrimary: index === 0 })));
  }

  function makePrimaryImage(imageId: string) {
    setImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === imageId })));
  }

  async function saveTasting() {
    if (isSaving) return;
    if (!rating && !comment.trim() && images.length === 0) {
      Alert.alert("Noch leer", "Bitte erfasse mindestens ein Foto, eine Bewertung oder einen Kommentar.");
      return;
    }
    setIsSaving(true);
    try {
      const primary = getPrimaryWineImage({ images });
      const fallbackName = `Degu-Eintrag ${new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })}`;
      const location = [eventName.trim(), supplier.trim(), stand.trim()].filter(Boolean).join(" · ");
      const item: WishlistItem = {
        id: createId(),
        name: wineName.trim() || fallbackName,
        producer: supplier.trim() || undefined,
        rating,
        notes: comment.trim() || undefined,
        imageUri: primary?.uri,
        images,
        tastedDate: toIsoDate(new Date()),
        tastedLocation: location || undefined,
        tastingEvent: eventName.trim() || undefined,
        tastingSupplier: supplier.trim() || undefined,
        tastingStand: stand.trim() || undefined,
        location,
        occasion: "Messe-Degustation",
        companions: "",
        createdAt: new Date().toISOString(),
        source: "tasting",
      };
      await addWishlistItem(item);
      router.push("/(tabs)/wishlist");
    } catch {
      Alert.alert("Fehler", "Eintrag konnte nicht gespeichert werden. Bitte erneut versuchen.");
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Wein-Degu</Text>
      <Text style={styles.subtitle}>Schnell erfassen am Stand, Details spaeter nachziehen.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kontext</Text>
        <TextInput style={styles.input} value={eventName} onChangeText={setEventName} placeholder="Messe / Event" />
        <TextInput style={styles.input} value={supplier} onChangeText={setSupplier} placeholder="Lieferant" />
        <TextInput style={styles.input} value={stand} onChangeText={setStand} placeholder="Stand / Halle" />
        <TextInput style={styles.input} value={wineName} onChangeText={setWineName} placeholder="Weinname optional" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fotos ({images.length}/3)</Text>
        {images.map((image) => (
          <View key={image.id} style={styles.imageTile}>
            <Image source={{ uri: image.uri }} style={styles.image} />
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
          </View>
        ))}
        {images.length < 3 && (
          <View style={styles.photoGrid}>
            <TouchableOpacity style={styles.photoButton} onPress={() => captureImage("Liste")}>
              <Text style={styles.photoButtonText}>Liste</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={() => captureImage("Flasche")}>
              <Text style={styles.photoButtonText}>Flasche</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonText}>Mediathek</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bewertung</Text>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} style={styles.starButton} onPress={() => setRating(star)}>
              <Text style={[styles.starText, rating !== undefined && star <= rating && styles.starTextActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={comment}
          onChangeText={setComment}
          placeholder="Kommentar optional"
          multiline
        />
      </View>

      <TouchableOpacity style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} onPress={saveTasting} disabled={isSaving}>
        <Text style={styles.saveButtonText}>{isSaving ? "Wird gespeichert…" : "In Merkliste speichern"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5" },
  content: { padding: 16, paddingBottom: 34, gap: 14 },
  title: { fontSize: 28, fontWeight: "900", color: "#1a0500" },
  subtitle: { color: "#7c706b", marginTop: -8, lineHeight: 20 },
  section: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e7ded9", padding: 14, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: WINE_RED, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#1a0500" },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  photoGrid: { flexDirection: "row", gap: 8 },
  photoButton: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: WINE_RED, paddingVertical: 12, alignItems: "center", backgroundColor: "#fdfafa" },
  photoButtonText: { color: WINE_RED, fontWeight: "800" },
  imageTile: { borderRadius: 12, overflow: "hidden", backgroundColor: "#1a0500", borderWidth: 1, borderColor: "#e7ded9" },
  image: { width: "100%", height: 190 },
  imageActions: { flexDirection: "row", gap: 8, padding: 8, backgroundColor: "#fff" },
  imagePill: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center", backgroundColor: "#f4eaea" },
  imagePillActive: { backgroundColor: WINE_RED },
  imagePillText: { color: WINE_RED, fontWeight: "800", fontSize: 12 },
  imagePillTextActive: { color: "#fff" },
  ratingRow: { flexDirection: "row", gap: 6 },
  starButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  starText: { fontSize: 32, color: "#d8d0cc" },
  starTextActive: { color: "#d59a20" },
  saveButton: { backgroundColor: WINE_RED, borderRadius: 12, padding: 16, alignItems: "center" },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
