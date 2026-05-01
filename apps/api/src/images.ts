const MAX_IMAGES_PER_RECORD = 3;
const MAX_IMAGES_JSON_BYTES = 3 * 1024 * 1024;

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatBytes(bytes: number): string {
  return `${Math.floor(bytes / 1024 / 1024)} MB`;
}

function validateImageEntry(value: unknown, index: number): string | null {
  if (!isJsonObject(value)) {
    return `"images[${index}]" must be an object.`;
  }

  if (typeof value.uri !== "string" || value.uri.trim().length === 0) {
    return `"images[${index}].uri" must be a non-empty string.`;
  }

  if ("id" in value && value.id !== undefined && typeof value.id !== "string") {
    return `"images[${index}].id" must be a string when provided.`;
  }

  if (
    "label" in value &&
    value.label !== undefined &&
    typeof value.label !== "string"
  ) {
    return `"images[${index}].label" must be a string when provided.`;
  }

  if (
    "isPrimary" in value &&
    value.isPrimary !== undefined &&
    typeof value.isPrimary !== "boolean"
  ) {
    return `"images[${index}].isPrimary" must be a boolean when provided.`;
  }

  if (
    "createdAt" in value &&
    value.createdAt !== undefined &&
    typeof value.createdAt !== "string"
  ) {
    return `"images[${index}].createdAt" must be a string when provided.`;
  }

  return null;
}

export function validateImagesPayload(
  payload: unknown,
): { ok: true; data: JsonObject } | { ok: false; error: string } {
  if (!isJsonObject(payload)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const { images } = payload;

  if (images === undefined || images === null) {
    return { ok: true, data: payload };
  }

  if (!Array.isArray(images)) {
    return { ok: false, error: "\"images\" must be an array when provided." };
  }

  if (images.length > MAX_IMAGES_PER_RECORD) {
    return {
      ok: false,
      error: `"images" may contain at most ${MAX_IMAGES_PER_RECORD} items.`,
    };
  }

  for (const [index, image] of images.entries()) {
    const error = validateImageEntry(image, index);
    if (error) {
      return { ok: false, error };
    }
  }

  const serializedImages = JSON.stringify(images);
  if (Buffer.byteLength(serializedImages, "utf8") > MAX_IMAGES_JSON_BYTES) {
    return {
      ok: false,
      error: `"images" payload is too large. Limit is ${formatBytes(MAX_IMAGES_JSON_BYTES)}.`,
    };
  }

  return { ok: true, data: payload };
}

export const imagePayloadConstraints = {
  maxImagesPerRecord: MAX_IMAGES_PER_RECORD,
  maxImagesJsonBytes: MAX_IMAGES_JSON_BYTES,
} as const;
