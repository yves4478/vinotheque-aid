import { IMAGE_COMPRESSION_QUALITY, IMAGE_MAX_DIMENSION } from "@vinotheque/core";

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
}

export function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<string> {
  const maxDimension = options.maxDimension ?? IMAGE_MAX_DIMENSION;
  const quality = options.quality ?? IMAGE_COMPRESSION_QUALITY;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
    reader.onload = () => {
      const result = reader.result as string;
      const img = new window.Image();
      img.onerror = () => reject(new Error("Bild konnte nicht verarbeitet werden."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
