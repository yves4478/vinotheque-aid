export function createId(): string {
  const cryptoProvider = (globalThis as typeof globalThis & {
    crypto?: { randomUUID?: () => string };
  }).crypto;

  if (typeof cryptoProvider?.randomUUID === "function") {
    return cryptoProvider.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
