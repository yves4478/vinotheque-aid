import { createId } from "@paralleldrive/cuid2";
import { Prisma, PrismaClient } from "@prisma/client";
import { uploadImage } from "../apps/api/src/storage";

const prisma = new PrismaClient();

type LegacyImage = {
  id?: string;
  uri?: string;
  label?: string;
  isPrimary?: boolean;
  createdAt?: string;
};

type DataImage = LegacyImage & {
  uri: string;
};

type Summary = {
  migrated: number;
  skipped: number;
  failed: number;
  cleanedWines: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDataImage(value: unknown): value is DataImage {
  return isRecord(value) && typeof value.uri === "string" && value.uri.startsWith("data:");
}

function decodeDataUri(dataUri: string): { data: Buffer; contentType: string; ext: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("ungueltige Data-URI");
  const contentType = match[1];
  const ext = contentType.split("/")[1] || "jpg";
  return {
    data: Buffer.from(match[2], "base64"),
    contentType,
    ext: ext === "jpeg" ? "jpg" : ext,
  };
}

function getLegacyImages(images: Prisma.JsonValue, imageData: string | null): {
  allImages: LegacyImage[];
  dataImages: DataImage[];
  remainingImages: LegacyImage[];
} {
  const allImages = Array.isArray(images)
    ? images.filter(isRecord).map((image) => image as LegacyImage)
    : [];
  const dataImages = allImages.filter(isDataImage);

  if (imageData?.startsWith("data:") && !dataImages.some((image) => image.uri === imageData)) {
    dataImages.push({
      id: "legacy-imageData",
      uri: imageData,
      label: "Flasche",
      isPrimary: dataImages.length === 0,
    });
  }

  return {
    allImages,
    dataImages,
    remainingImages: allImages.filter((image) => !image.uri?.startsWith("data:")),
  };
}

async function migrateWineImages() {
  const summary: Summary = { migrated: 0, skipped: 0, failed: 0, cleanedWines: 0 };
  const wines = await prisma.wine.findMany({
    where: {
      OR: [
        { images: { not: Prisma.DbNull } },
        { imageData: { not: null } },
      ],
    },
    include: { wineImages: true },
  });

  for (const wine of wines) {
    const { dataImages, remainingImages } = getLegacyImages(wine.images, wine.imageData);
    if (dataImages.length === 0) continue;

    const hasPrimary = wine.wineImages.some((image) => image.isPrimary);
    let wineHadFailure = false;

    for (let index = 0; index < dataImages.length; index++) {
      const image = dataImages[index];
      const sourceId = image.id?.replace(/[^a-zA-Z0-9_-]/g, "") || createId();

      try {
        const decoded = decodeDataUri(image.uri);
        const storageKey = `migrations/wines/${wine.id}/${sourceId}.${decoded.ext}`;
        const existing = await prisma.wineImage.findFirst({ where: { wineId: wine.id, storageKey } });
        if (existing) {
          summary.skipped++;
          continue;
        }

        const url = await uploadImage(storageKey, decoded.data, decoded.contentType);
        const isPrimary = Boolean(image.isPrimary) || (!hasPrimary && index === 0);
        if (isPrimary) {
          await prisma.wineImage.updateMany({ where: { wineId: wine.id }, data: { isPrimary: false } });
        }
        await prisma.wineImage.create({
          data: {
            id: createId(),
            wineId: wine.id,
            storageKey,
            url,
            label: image.label ?? "Flasche",
            isPrimary,
            bytes: decoded.data.byteLength,
          },
        });
        summary.migrated++;
      } catch (error) {
        wineHadFailure = true;
        summary.failed++;
        console.error(`Fehler bei Wein ${wine.id} (${wine.name}):`, error);
      }
    }

    if (!wineHadFailure) {
      await prisma.wine.update({
        where: { id: wine.id },
        data: {
          images: remainingImages.length > 0 ? remainingImages as Prisma.InputJsonValue : Prisma.DbNull,
          imageData: wine.imageData?.startsWith("data:") ? null : wine.imageData,
        },
      });
      summary.cleanedWines++;
    }
  }

  console.log("Migration abgeschlossen:", summary);
}

migrateWineImages()
  .catch((error) => {
    console.error("Migration fehlgeschlagen:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
