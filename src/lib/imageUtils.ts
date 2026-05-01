export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
}

function supportsCanvasFilter(ctx: CanvasRenderingContext2D): boolean {
  return "filter" in ctx && typeof ctx.filter === "string";
}

export async function compressImageForOcr(
  file: File,
  { maxDimension = 1400, quality = 0.88 }: CompressOptions = {},
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }

      // Slight contrast and brightness boost for OCR readability
      if (supportsCanvasFilter(ctx)) {
        ctx.filter = "contrast(1.15) brightness(1.05)";
      }
      ctx.drawImage(img, 0, 0, width, height);
      if (supportsCanvasFilter(ctx)) {
        ctx.filter = "none";
      }

      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
