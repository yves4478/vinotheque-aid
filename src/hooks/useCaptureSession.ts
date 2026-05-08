import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

function req<T>(path: string, init?: RequestInit): Promise<T> {
  return fetch(`${API_BASE_URL}${path}`, init).then((response) => {
    if (!response.ok) {
      return response.json().then((error) => Promise.reject(error));
    }
    return response.json() as Promise<T>;
  });
}

export type CaptureSessionStatus =
  | "open"
  | "submitted"
  | "recognizing"
  | "ready_for_review"
  | "completed";

export type CaptureSessionListItem = {
  id: string;
  status: CaptureSessionStatus;
  createdAt: string;
  costCents: number;
  _count: { photos: number; candidates: number };
};

export type CapturePhoto = {
  id: string;
  url: string;
  status: string;
};

export type Candidate = {
  id: string;
  photoId: string;
  name: string | null;
  producer: string | null;
  vintage: number | null;
  region: string | null;
  country: string | null;
  type: string | null;
  confidence: number | null;
  status: string;
  bbox: { x: number; y: number; w: number; h: number } | null;
};

export type CaptureSessionDetail = {
  id: string;
  status: CaptureSessionStatus;
  costCents: number;
  createdAt: string;
  photos: CapturePhoto[];
  candidates: Candidate[];
};

export type SaveEntry = {
  candidateId: string;
  action: "create" | "addToExisting";
  wineId?: string;
  quantity: number;
  fields?: {
    name?: string;
    producer?: string;
    vintage?: number;
    region?: string;
    country?: string;
    type?: string;
  };
};

export function useCaptureSessions() {
  return useQuery<CaptureSessionListItem[]>({
    queryKey: ["capture-sessions"],
    queryFn: () => req("/api/capture-sessions"),
    refetchInterval: (query) => {
      const active = (query.state.data ?? []).some((session: CaptureSessionListItem) =>
        ["submitted", "recognizing"].includes(session.status),
      );
      return active ? 5000 : false;
    },
  });
}

export function useCaptureSession(id: string) {
  return useQuery<CaptureSessionDetail>({
    queryKey: ["capture-session", id],
    queryFn: () => req(`/api/capture-sessions/${id}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "recognizing" || status === "submitted" ? 3000 : false;
    },
  });
}

export function useUpdateCandidate(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Candidate> }) =>
      req(`/api/capture-sessions/${sessionId}/candidates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["capture-session", sessionId] }),
  });
}

export function useAcceptCandidate(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (candidateId: string) =>
      req(`/api/capture-sessions/${sessionId}/candidates/${candidateId}/accept`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["capture-session", sessionId] }),
  });
}

export function useRejectCandidate(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (candidateId: string) =>
      req(`/api/capture-sessions/${sessionId}/candidates/${candidateId}/reject`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["capture-session", sessionId] }),
  });
}

export function useFinalizeCaptureSession(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (saves: SaveEntry[]) =>
      req(`/api/capture-sessions/${sessionId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saves }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capture-session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["capture-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["wines"] });
    },
  });
}
