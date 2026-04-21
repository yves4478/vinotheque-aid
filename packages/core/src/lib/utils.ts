// TODO (transfer agent): copy full content from src/lib/utils.ts
// Remove any tailwind/clsx browser helpers — not needed in core.
// Keep only pure helper functions (createId, date helpers, etc.).

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
