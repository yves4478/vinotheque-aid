import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

export type CaptureSessionStatus =
  | "open"
  | "submitted"
  | "recognizing"
  | "ready_for_review"
  | "completed";

export type CaptureSession = {
  id: string;
  status: CaptureSessionStatus;
  createdAt: string;
  costCents: number;
};

export type CapturePhotoItem = {
  id: string;
  url: string;
  status: "uploading" | "uploaded" | "failed";
};

export const ACTIVE_SESSION_KEY = "vinotheque.activeCaptureSession";

export async function createCaptureSession(): Promise<CaptureSession> {
  const res = await fetch(`${API_BASE_URL}/api/capture-sessions`, { method: "POST" });
  if (!res.ok) throw new Error("Session konnte nicht erstellt werden.");
  return res.json();
}

export async function uploadCapturePhoto(sessionId: string, localUri: string): Promise<CapturePhotoItem> {
  const formData = new FormData();
  formData.append("photo", { uri: localUri, name: "photo.jpg", type: "image/jpeg" } as never);
  const res = await fetch(`${API_BASE_URL}/api/capture-sessions/${sessionId}/photos`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload fehlgeschlagen.");
  return res.json();
}

export async function deleteCapturePhoto(sessionId: string, photoId: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/capture-sessions/${sessionId}/photos/${photoId}`, { method: "DELETE" });
}

export async function submitCaptureSession(sessionId: string): Promise<CaptureSession> {
  const res = await fetch(`${API_BASE_URL}/api/capture-sessions/${sessionId}/submit`, { method: "POST" });
  if (!res.ok) throw new Error("Submit fehlgeschlagen.");
  return res.json();
}

export async function saveActiveSession(session: CaptureSession): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
}

export async function loadActiveSession(): Promise<CaptureSession | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
  return raw ? JSON.parse(raw) as CaptureSession : null;
}

export async function clearActiveSession(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
}
