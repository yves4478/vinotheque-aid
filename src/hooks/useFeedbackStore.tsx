import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const FEEDBACK_KEY = "vinvault_feedback";

export interface FeedbackEntry {
  id: string;
  type: "bug" | "suggestion";
  page: string;
  message: string;
  timestamp: string;
  status: "open" | "resolved" | "implemented";
}

function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadFeedback(): FeedbackEntry[] {
  try {
    const stored = localStorage.getItem(FEEDBACK_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* ignore */ }
  return [];
}

function saveFeedback(entries: FeedbackEntry[]) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(entries));
}

interface FeedbackContextType {
  feedback: FeedbackEntry[];
  addFeedback: (type: "bug" | "suggestion", page: string, message: string) => void;
  removeFeedback: (id: string) => void;
  updateStatus: (id: string, status: FeedbackEntry["status"]) => void;
  exportFeedbackJSON: () => string;
  downloadFeedbackJSON: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>(loadFeedback);

  useEffect(() => {
    saveFeedback(feedback);
  }, [feedback]);

  const addFeedback = useCallback((type: "bug" | "suggestion", page: string, message: string) => {
    const entry: FeedbackEntry = {
      id: generateId(),
      type,
      page,
      message,
      timestamp: new Date().toISOString(),
      status: "open",
    };
    setFeedback((prev) => [...prev, entry]);
  }, []);

  const removeFeedback = useCallback((id: string) => {
    setFeedback((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateStatus = useCallback((id: string, status: FeedbackEntry["status"]) => {
    setFeedback((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  }, []);

  const exportFeedbackJSON = useCallback(() => {
    return JSON.stringify(feedback, null, 2);
  }, [feedback]);

  const downloadFeedbackJSON = useCallback(() => {
    const json = JSON.stringify(feedback, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedback.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [feedback]);

  return (
    <FeedbackContext.Provider
      value={{ feedback, addFeedback, removeFeedback, updateStatus, exportFeedbackJSON, downloadFeedbackJSON }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedbackStore() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedbackStore must be used within FeedbackProvider");
  return ctx;
}
