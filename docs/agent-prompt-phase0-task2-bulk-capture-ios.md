# Codex Prompt — Phase 0 / Task 2: Bulk-Capture iOS Aufnahme-Flow

## Auftrag

Baue auf iOS einen Aufnahme-Flow fuer Keller-Sessions: Der Nutzer oeffnet die Kamera, macht mehrere Fotos von Regalfaechern, die App laedt sie auf das Backend hoch. Kein OCR im Client — nur Foto-Aufnahme und Upload.

**Repository:** `yves4478/vinotheque-aid`
**Branch:** `claude/plan-app-architecture-6dUk6`
**Arbeitsverzeichnis:** `apps/mobile/`

---

## Was bereits existiert (Referenz und Basis)

- `apps/mobile/app/(tabs)/add.tsx` — verwendet `expo-image-picker` (Pattern uebernehmen)
- `apps/mobile/store/useWineStore.ts` — verwendet `AsyncStorage` und `api` aus `@/lib/apiClient`
- `apps/mobile/lib/apiClient.ts` — HTTP-Client fuer API-Aufrufe
- `expo-image-picker` ist bereits installiert

---

## API-Kontrakt (dieser Task ruft das Backend auf, das in Task 0.3 gebaut wird)

Du musst beim Entwickeln gegen folgende API programmieren. Falls Task 0.3 noch nicht fertig ist, mock die Calls mit `console.log` und einem fake `sessionId = "dev-session"`.

```
POST /api/capture-sessions
  → { id: string, status: "open", createdAt: string }

POST /api/capture-sessions/:id/photos   (multipart/form-data, Feld: "photo")
  → { id: string, url: string, status: "uploaded" }

DELETE /api/capture-sessions/:id/photos/:photoId
  → { deleted: true }

POST /api/capture-sessions/:id/submit
  → { id: string, status: "submitted" }

GET /api/capture-sessions
  → CaptureSession[]
```

---

## Was du baust

### Schritt 1 — Typen in `apps/mobile/lib/captureApi.ts` (NEU)

```typescript
export type CaptureSession = {
  id: string;
  status: "open" | "submitted" | "recognizing" | "ready_for_review" | "completed";
  createdAt: string;
  photos?: CapturePhotoItem[];
};

export type CapturePhotoItem = {
  id: string;
  url: string;
  status: "uploading" | "uploaded" | "failed";
};

import { api } from "@/lib/apiClient";

export async function createCaptureSession(): Promise<CaptureSession> {
  return api.post("/api/capture-sessions", {});
}

export async function uploadCapturePhoto(
  sessionId: string,
  localUri: string,
): Promise<CapturePhotoItem> {
  const formData = new FormData();
  // React Native FormData akzeptiert URI direkt:
  formData.append("photo", { uri: localUri, name: "photo.jpg", type: "image/jpeg" } as never);
  return api.postForm(`/api/capture-sessions/${sessionId}/photos`, formData);
}

export async function deleteCapturePhoto(sessionId: string, photoId: string): Promise<void> {
  return api.delete(`/api/capture-sessions/${sessionId}/photos/${photoId}`);
}

export async function submitCaptureSession(sessionId: string): Promise<CaptureSession> {
  return api.post(`/api/capture-sessions/${sessionId}/submit`, {});
}

export async function listCaptureSessions(): Promise<CaptureSession[]> {
  return api.get("/api/capture-sessions");
}
```

**Hinweis:** Passe `api.postForm` und andere Methoden an den vorhandenen `apiClient` an. Falls der Client kein `postForm` hat, schreib einen `fetch`-Aufruf direkt.

### Schritt 2 — AsyncStorage-Key fuer aktive Session

Konstante in `apps/mobile/lib/captureApi.ts` ergaenzen:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ACTIVE_SESSION_KEY = "vinotheque.activeCaptureSession";

export async function saveActiveSessionId(id: string) {
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, id);
}

export async function loadActiveSessionId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_SESSION_KEY);
}

export async function clearActiveSessionId() {
  await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
}
```

### Schritt 3 — Capture Screen anlegen

Neue Datei `apps/mobile/app/capture/index.tsx`:

```typescript
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  createCaptureSession,
  uploadCapturePhoto,
  deleteCapturePhoto,
  submitCaptureSession,
  saveActiveSessionId,
  clearActiveSessionId,
  type CapturePhotoItem,
} from "@/lib/captureApi";

type LocalPhoto = CapturePhotoItem & { localUri: string };

export default function CaptureScreen() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const session = await createCaptureSession();
    await saveActiveSessionId(session.id);
    setSessionId(session.id);
    return session.id;
  }

  const handleAddPhoto = useCallback(async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled) return;

    const localUri = result.assets[0].uri;
    const placeholder: LocalPhoto = {
      id: `local-${Date.now()}`,
      url: localUri,
      localUri,
      status: "uploading",
    };
    setPhotos((prev) => [...prev, placeholder]);

    try {
      const sid = await ensureSession();
      const uploaded = await uploadCapturePhoto(sid, localUri);
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === placeholder.id
            ? { ...uploaded, localUri, status: "uploaded" }
            : p,
        ),
      );
    } catch {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === placeholder.id ? { ...p, status: "failed" } : p,
        ),
      );
    }
  }, [sessionId]);

  const handleDelete = useCallback(
    async (photo: LocalPhoto) => {
      if (!sessionId || photo.status === "uploading") return;
      Alert.alert("Foto loeschen?", "", [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Loeschen",
          style: "destructive",
          onPress: async () => {
            if (photo.status === "uploaded") {
              await deleteCapturePhoto(sessionId, photo.id).catch(() => {});
            }
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
          },
        },
      ]);
    },
    [sessionId],
  );

  const handleSubmit = useCallback(async () => {
    if (!sessionId) return;
    const ready = photos.filter((p) => p.status === "uploaded");
    if (ready.length === 0) {
      Alert.alert("Keine Fotos", "Bitte zuerst Fotos aufnehmen.");
      return;
    }
    setSubmitting(true);
    try {
      await submitCaptureSession(sessionId);
      await clearActiveSessionId();
      Alert.alert(
        "Erkennung gestartet",
        `${ready.length} Fotos werden analysiert. Das Ergebnis kannst du in der Web-App reviewen.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch {
      Alert.alert("Fehler", "Session konnte nicht abgeschlossen werden.");
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, photos, router]);

  const uploaded = photos.filter((p) => p.status === "uploaded").length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Keller erfassen</Text>
      <Text style={styles.hint}>
        Fotografiere Regalfaecher — mehrere Flaschen pro Bild sind ideal.
      </Text>

      <FlatList
        data={photos}
        numColumns={2}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Pressable
            style={styles.thumb}
            onLongPress={() => handleDelete(item)}
          >
            <Image source={{ uri: item.localUri }} style={styles.thumbImg} />
            {item.status === "uploading" && (
              <View style={styles.overlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            {item.status === "failed" && (
              <View style={styles.overlay}>
                <Text style={styles.failedText}>!</Text>
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Noch keine Fotos. Tippe auf +.</Text>
        }
      />

      <View style={styles.footer}>
        <Pressable style={styles.addBtn} onPress={handleAddPhoto}>
          <Text style={styles.addBtnText}>+ Foto aufnehmen</Text>
        </Pressable>

        {photos.length > 0 && (
          <Pressable
            style={[styles.submitBtn, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                Fertig — {uploaded} Foto{uploaded !== 1 ? "s" : ""} senden
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0e0d", padding: 16 },
  title:     { fontSize: 22, fontWeight: "700", color: "#e8d5b0", marginBottom: 6 },
  hint:      { fontSize: 13, color: "#888", marginBottom: 16 },
  grid:      { gap: 8, paddingBottom: 100 },
  thumb:     { flex: 1, margin: 4, aspectRatio: 1, borderRadius: 8, overflow: "hidden", backgroundColor: "#1a1a1a" },
  thumbImg:  { width: "100%", height: "100%" },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000066", justifyContent: "center", alignItems: "center" },
  failedText:{ fontSize: 24, color: "#ff4444", fontWeight: "700" },
  empty:     { color: "#555", textAlign: "center", marginTop: 60 },
  footer:    { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, gap: 10, backgroundColor: "#0f0e0d" },
  addBtn:    { backgroundColor: "#7c1f1f", padding: 16, borderRadius: 10, alignItems: "center" },
  addBtnText:{ color: "#e8d5b0", fontSize: 16, fontWeight: "600" },
  submitBtn: { backgroundColor: "#2d5a2d", padding: 16, borderRadius: 10, alignItems: "center" },
  submitBtnText: { color: "#e8d5b0", fontSize: 16, fontWeight: "600" },
  disabled:  { opacity: 0.5 },
});
```

### Schritt 4 — Capture-Einstieg in "Mehr"-Tab (oder Add-Tab)

In `apps/mobile/app/(tabs)/add.tsx` (oder wo der "Mehr"-Tab liegt) einen neuen Einstiegspunkt ergaenzen. Suche nach einer geeigneten Stelle und fuege hinzu:

```typescript
import { useRouter } from "expo-router";

// Im JSX:
<Pressable onPress={() => router.push("/capture")} style={styles.captureEntry}>
  <Text style={styles.captureEntryTitle}>Keller erfassen</Text>
  <Text style={styles.captureEntryHint}>
    Mehrere Flaschen per Foto — ideal fuer die Ersterfassung
  </Text>
</Pressable>
```

Styling passend zum bestehenden Stil der Seite.

---

## Abschluss

**TypeScript-Check:**
```bash
cd apps/mobile
npx tsc --noEmit -p tsconfig.json
```

**Commit:**
```
feat(mobile): bulk-capture flow for cellar onboarding

- captureApi.ts: typed API client for capture sessions
- app/capture/index.tsx: photo capture screen with upload status
- Add entry point in add/more tab

Phase 0 Task 2
```

**Push:**
```bash
git push -u origin claude/plan-app-architecture-6dUk6
```

---

## Was du NICHT tun sollst

- Kein OCR oder Bild-Analyse im Client — der Server macht das
- Kein Eintrag in `Wine.images` oder `WineStore` — Capture Photos sind eigenstaendig
- Kein neues UI-Library installieren — bestehende RN-Primitives reichen
- Nicht den bestehenden `add.tsx`-Flow aendern oder loeschen
- Kein `expo run:ios` oder Build-Aufruf im Commit
