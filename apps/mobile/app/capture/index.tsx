import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  clearActiveSession,
  createCaptureSession,
  loadActiveSession,
  saveActiveSession,
  submitCaptureSession,
  uploadCapturePhoto,
  type CapturePhotoItem,
  type CaptureSession,
} from "@/lib/captureApi";

type LocalPhoto = CapturePhotoItem & {
  localUri: string;
};

export default function CaptureScreen() {
  const router = useRouter();
  const [session, setSession] = useState<CaptureSession | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadActiveSession().then(setSession).catch(() => setSession(null));
  }, []);

  async function ensureSession(): Promise<CaptureSession> {
    if (session) return session;
    const next = await createCaptureSession();
    setSession(next);
    await saveActiveSession(next);
    return next;
  }

  async function addPhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Kamera nicht freigegeben", "Bitte erlaube den Kamerazugriff.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.75,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const tempId = `local-${Date.now()}`;
    setPhotos((current) => [
      ...current,
      { id: tempId, localUri: asset.uri, url: asset.uri, status: "uploading" },
    ]);
    setBusy(true);

    try {
      const activeSession = await ensureSession();
      const uploaded = await uploadCapturePhoto(activeSession.id, asset.uri);
      setPhotos((current) => current.map((photo) => (
        photo.id === tempId ? { ...uploaded, localUri: asset.uri } : photo
      )));
    } catch {
      setPhotos((current) => current.map((photo) => (
        photo.id === tempId ? { ...photo, status: "failed" } : photo
      )));
      Alert.alert("Upload fehlgeschlagen", "Das Foto konnte nicht hochgeladen werden.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!session || photos.filter((photo) => photo.status === "uploaded").length === 0) return;
    setSubmitting(true);
    try {
      const submitted = await submitCaptureSession(session.id);
      await clearActiveSession();
      setSession(submitted);
      Alert.alert(
        "Erkennung gestartet",
        "Die Fotos werden analysiert. Du kannst die Ergebnisse anschliessend in der Web-App pruefen.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch {
      Alert.alert("Submit fehlgeschlagen", "Die Session konnte nicht eingereicht werden.");
    } finally {
      setSubmitting(false);
    }
  }

  const uploadedCount = photos.filter((photo) => photo.status === "uploaded").length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Keller erfassen</Text>
      <Text style={styles.hint}>
        Fotografiere Regalfaecher mit mehreren Flaschen. Die Auswertung und Korrektur erfolgt in der Web-App.
      </Text>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={<Text style={styles.empty}>Noch keine Fotos.</Text>}
        renderItem={({ item }) => (
          <View style={styles.thumb}>
            <Image source={{ uri: item.localUri }} style={styles.thumbImg} />
            {item.status !== "uploaded" && (
              <View style={styles.overlay}>
                {item.status === "uploading" ? (
                  <ActivityIndicator color="#e8d5b0" />
                ) : (
                  <Text style={styles.failTxt}>!</Text>
                )}
              </View>
            )}
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addBtn, busy && styles.disabled]}
          onPress={addPhoto}
          disabled={busy || submitting}
        >
          <Text style={styles.addBtnTxt}>{busy ? "Upload laeuft..." : "Foto aufnehmen"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, (uploadedCount === 0 || submitting) && styles.disabled]}
          onPress={submit}
          disabled={uploadedCount === 0 || submitting}
        >
          <Text style={styles.submitBtnTxt}>
            {submitting ? "Starte Erkennung..." : `${uploadedCount} Foto${uploadedCount !== 1 ? "s" : ""} analysieren`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0e0d", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#e8d5b0", marginBottom: 6 },
  hint: { fontSize: 13, color: "#a79a86", marginBottom: 16, lineHeight: 19 },
  grid: { gap: 8, paddingBottom: 128 },
  thumb: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  thumbImg: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  failTxt: { fontSize: 24, color: "#ff4444", fontWeight: "700" },
  empty: { color: "#777", textAlign: "center", marginTop: 60 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 10,
    backgroundColor: "#0f0e0d",
  },
  addBtn: { backgroundColor: "#7c1f1f", padding: 16, borderRadius: 10, alignItems: "center" },
  addBtnTxt: { color: "#e8d5b0", fontSize: 16, fontWeight: "600" },
  submitBtn: { backgroundColor: "#2d5a2d", padding: 16, borderRadius: 10, alignItems: "center" },
  submitBtnTxt: { color: "#e8d5b0", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
