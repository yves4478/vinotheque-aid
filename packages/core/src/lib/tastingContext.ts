import type { WishlistItem } from "../types/wine";

type TastingContextSource = Pick<
  WishlistItem,
  "tastingEvent" | "tastingSupplier" | "tastingStand"
>;

export function buildTastingContextNote(source: TastingContextSource): string | undefined {
  const parts = [
    source.tastingEvent?.trim(),
    source.tastingSupplier?.trim(),
    source.tastingStand?.trim(),
  ].filter(Boolean);

  if (parts.length === 0) return undefined;
  return `Tasting-Kontext: ${parts.join(" · ")}`;
}

export function appendTastingContextToNotes(
  notes: string | undefined,
  source: TastingContextSource,
): string | undefined {
  const tastingNote = buildTastingContextNote(source);
  const trimmedNotes = notes?.trim();

  if (!tastingNote) return trimmedNotes || undefined;
  if (!trimmedNotes) return tastingNote;
  if (trimmedNotes.includes(tastingNote)) return trimmedNotes;

  return `${trimmedNotes}\n\n${tastingNote}`;
}
