import { Hono } from "hono";
import { createId } from "@paralleldrive/cuid2";
import prisma from "../db";
import { validateImagesPayload } from "../images";
import { deleteImage, uploadImage } from "../storage";

export const winesRouter = new Hono();

type WineImageResponse = {
  id: string;
  uri: string;
  storageKey: string;
  label?: "Flasche" | "Etikett" | "Ruecketikett" | "Liste" | "Stand" | "Notiz";
  isPrimary: boolean;
  createdAt: string;
};

type WineWithImages = Awaited<ReturnType<typeof prisma.wine.findMany>>[number] & {
  wineImages?: Array<{
    id: string;
    storageKey: string;
    url: string;
    label: string | null;
    isPrimary: boolean;
    createdAt: Date;
  }>;
};

function toImageResponse(image: NonNullable<WineWithImages["wineImages"]>[number]): WineImageResponse {
  return {
    id: image.id,
    uri: image.url,
    storageKey: image.storageKey,
    label: image.label as WineImageResponse["label"],
    isPrimary: image.isPrimary,
    createdAt: image.createdAt.toISOString(),
  };
}

function toWineResponse(wine: WineWithImages) {
  const { wineImages, ...data } = wine;
  const storedImages = wineImages?.map(toImageResponse) ?? [];
  return {
    ...data,
    images: storedImages.length > 0 ? storedImages : data.images,
  };
}

function sanitizeWinePayload(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data };
  const images = Array.isArray(next.images) ? next.images : undefined;
  if (images?.some((image) => typeof image?.uri === "string" && image.uri.startsWith("data:"))) {
    delete next.images;
  }
  if (typeof next.imageData === "string" && next.imageData.startsWith("data:")) {
    delete next.imageData;
  }
  if (typeof next.imageUri === "string" && next.imageUri.startsWith("data:")) {
    delete next.imageUri;
  }
  return next;
}

winesRouter.get("/", async (c) => {
  const wines = await prisma.wine.findMany({
    orderBy: { updatedAt: "desc" },
    include: { wineImages: { orderBy: { createdAt: "asc" } } },
  });
  return c.json(wines.map(toWineResponse));
});

winesRouter.post("/", async (c) => {
  const payload = validateImagesPayload(await c.req.json());
  if (!payload.ok) {
    return c.json({ error: payload.error }, 400);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { updatedAt: _u, ...data } = sanitizeWinePayload(payload.data as Record<string, unknown>) as any;
  const wine = await prisma.wine.upsert({
    where: { id: data.id },
    create: data,
    update: data,
    include: { wineImages: { orderBy: { createdAt: "asc" } } },
  });
  return c.json(toWineResponse(wine), 201);
});

winesRouter.put("/:id", async (c) => {
  const payload = validateImagesPayload(await c.req.json());
  if (!payload.ok) {
    return c.json({ error: payload.error }, 400);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { updatedAt: _u, id: _id, ...data } = sanitizeWinePayload(payload.data as Record<string, unknown>) as any;
  const wine = await prisma.wine.update({
    where: { id: c.req.param("id") },
    data,
    include: { wineImages: { orderBy: { createdAt: "asc" } } },
  });
  return c.json(toWineResponse(wine));
});

winesRouter.delete("/:id", async (c) => {
  const wineId = c.req.param("id");
  const wineImages = await prisma.wineImage.findMany({ where: { wineId } });
  await prisma.wine.delete({ where: { id: wineId } });
  // Storage delete after DB commit — orphaned objects are preferable to broken DB records
  await Promise.all(wineImages.map((image) => deleteImage(image.storageKey)));
  return c.json({ deleted: true });
});

winesRouter.post("/:id/images", async (c) => {
  const wineId = c.req.param("id");
  const wine = await prisma.wine.findUnique({
    where: { id: wineId },
    include: { _count: { select: { wineImages: true } } },
  });
  if (!wine) return c.json({ error: "Wein nicht gefunden." }, 404);
  if (wine._count.wineImages >= 3) return c.json({ error: "Maximal 3 Bilder." }, 400);

  const formData = await c.req.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) return c.json({ error: "Feld 'image' fehlt." }, 400);
  if (!file.type.startsWith("image/")) return c.json({ error: "Nur Bilder sind erlaubt." }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ error: "Max 10 MB." }, 400);

  const label = String(formData.get("label") ?? "Flasche");
  const requestedPrimary = String(formData.get("isPrimary") ?? "") === "true";
  const isPrimary = requestedPrimary || wine._count.wineImages === 0;
  const ext = file.type.split("/")[1] ?? "jpg";
  const storageKey = `wines/${wineId}/${createId()}.${ext}`;
  const url = await uploadImage(storageKey, Buffer.from(await file.arrayBuffer()), file.type);

  if (isPrimary) {
    await prisma.wineImage.updateMany({ where: { wineId }, data: { isPrimary: false } });
  }
  const image = await prisma.wineImage.create({
    data: {
      id: createId(),
      wineId,
      storageKey,
      url,
      label,
      isPrimary,
      bytes: file.size,
    },
  });

  return c.json(toImageResponse(image), 201);
});

winesRouter.post("/:id/images/:imageId/primary", async (c) => {
  const wineId = c.req.param("id");
  const imageId = c.req.param("imageId");
  const image = await prisma.wineImage.findUnique({ where: { id: imageId } });
  if (!image || image.wineId !== wineId) return c.json({ error: "Bild nicht gefunden." }, 404);

  await prisma.$transaction([
    prisma.wineImage.updateMany({ where: { wineId }, data: { isPrimary: false } }),
    prisma.wineImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);

  return c.json({ primaryImageId: imageId });
});

winesRouter.delete("/:id/images/:imageId", async (c) => {
  const wineId = c.req.param("id");
  const imageId = c.req.param("imageId");
  const image = await prisma.wineImage.findUnique({ where: { id: imageId } });
  if (!image || image.wineId !== wineId) return c.json({ error: "Bild nicht gefunden." }, 404);

  // Promote next primary first while DB record still exists
  if (image.isPrimary) {
    const nextPrimary = await prisma.wineImage.findFirst({
      where: { wineId, id: { not: imageId } },
      orderBy: { createdAt: "asc" },
    });
    if (nextPrimary) {
      await prisma.wineImage.update({ where: { id: nextPrimary.id }, data: { isPrimary: true } });
    }
  }
  await prisma.wineImage.delete({ where: { id: imageId } });
  // Storage delete after DB commit — orphaned objects are preferable to broken DB records
  await deleteImage(image.storageKey);

  return c.json({ deleted: true });
});
