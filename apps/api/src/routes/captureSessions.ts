import { createId } from "@paralleldrive/cuid2";
import type { Prisma } from "@prisma/client";
import { Hono } from "hono";
import prisma from "../db";
import { estimateCostCents, recognizeBottles } from "../recognition";
import { deleteImage, uploadImage } from "../storage";

export const captureSessionsRouter = new Hono();

type CapturePhotoJob = {
  id: string;
  url: string;
};

type FinalizeRequest = {
  saves: Array<{
    candidateId: string;
    action: "create" | "addToExisting";
    wineId?: string;
    quantity?: number;
    fields?: {
      name?: string;
      producer?: string;
      vintage?: number;
      region?: string;
      country?: string;
      type?: string;
      notes?: string;
    };
  }>;
};

captureSessionsRouter.post("/", async (c) => {
  const session = await prisma.captureSession.create({ data: {} });
  return c.json(session, 201);
});

captureSessionsRouter.get("/", async (c) => {
  const sessions = await prisma.captureSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true, candidates: true } } },
  });
  return c.json(sessions);
});

captureSessionsRouter.get("/:id", async (c) => {
  const session = await prisma.captureSession.findUnique({
    where: { id: c.req.param("id") },
    include: {
      photos: { orderBy: { createdAt: "asc" } },
      candidates: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!session) return c.json({ error: "Nicht gefunden." }, 404);
  return c.json(session);
});

captureSessionsRouter.post("/:id/photos", async (c) => {
  const sessionId = c.req.param("id");
  const session = await prisma.captureSession.findUnique({ where: { id: sessionId } });
  if (!session) return c.json({ error: "Session nicht gefunden." }, 404);
  if (session.status !== "open") return c.json({ error: "Session ist nicht offen." }, 409);

  const formData = await c.req.formData();
  const file = formData.get("photo");
  if (!(file instanceof File)) return c.json({ error: "Feld 'photo' fehlt." }, 400);
  if (!file.type.startsWith("image/")) return c.json({ error: "Nur Bilder sind erlaubt." }, 400);
  if (file.size > 10 * 1024 * 1024) return c.json({ error: "Max 10 MB." }, 400);

  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `captures/${sessionId}/${createId()}.${ext}`;
  const url = await uploadImage(key, Buffer.from(await file.arrayBuffer()), file.type);
  const photo = await prisma.capturePhoto.create({
    data: { id: createId(), sessionId, storageKey: key, url, bytes: file.size },
  });
  return c.json(photo, 201);
});

captureSessionsRouter.delete("/:id/photos/:photoId", async (c) => {
  const photo = await prisma.capturePhoto.findUnique({ where: { id: c.req.param("photoId") } });
  if (!photo || photo.sessionId !== c.req.param("id")) return c.json({ error: "Nicht gefunden." }, 404);
  await deleteImage(photo.storageKey);
  await prisma.capturePhoto.delete({ where: { id: photo.id } });
  return c.json({ deleted: true });
});

captureSessionsRouter.post("/:id/submit", async (c) => {
  const sessionId = c.req.param("id");
  const session = await prisma.captureSession.findUnique({
    where: { id: sessionId },
    include: { photos: true },
  });
  if (!session) return c.json({ error: "Nicht gefunden." }, 404);
  if (session.status !== "open") return c.json({ error: "Bereits eingereicht." }, 409);
  if (session.photos.length === 0) return c.json({ error: "Keine Fotos." }, 400);

  await prisma.captureSession.update({ where: { id: sessionId }, data: { status: "recognizing" } });
  processSession(sessionId, session.photos).catch((err) =>
    console.error(`Session ${sessionId} failed:`, err),
  );
  return c.json({ id: sessionId, status: "recognizing" });
});

async function processSession(sessionId: string, photos: CapturePhotoJob[]) {
  let totalCostCents = 0;
  let failedCount = 0;
  const concurrency = 5;
  for (let i = 0; i < photos.length; i += concurrency) {
    await Promise.all(
      photos.slice(i, i + concurrency).map(async (photo) => {
        try {
          const { bottles, inputTokens, outputTokens } = await recognizeBottles(photo.url);
          totalCostCents += estimateCostCents(inputTokens, outputTokens);
          await prisma.capturePhoto.update({
            where: { id: photo.id },
            data: { status: "recognized" },
          });
          if (bottles.length > 0) {
            await prisma.recognizedCandidate.createMany({
              data: bottles.map((bottle) => ({
                id: createId(),
                sessionId,
                photoId: photo.id,
                name: bottle.name ?? null,
                producer: bottle.producer ?? null,
                vintage: bottle.vintage ?? null,
                region: bottle.region ?? null,
                country: bottle.country ?? null,
                type: bottle.type ?? null,
                confidence: bottle.confidence ?? null,
                rawJson: bottle as Prisma.InputJsonObject,
                bbox: bottle.bbox,
              })),
            });
          }
        } catch (err) {
          failedCount++;
          await prisma.capturePhoto.update({
            where: { id: photo.id },
            data: { status: "failed", recognitionError: String(err) },
          });
        }
      }),
    );
  }
  const nextStatus = failedCount === photos.length ? "failed" : "ready_for_review";
  await prisma.captureSession.update({
    where: { id: sessionId },
    data: { status: nextStatus, costCents: { increment: totalCostCents } },
  });
}

captureSessionsRouter.put("/:id/candidates/:cId", async (c) => {
  const body = await c.req.json();
  const candidate = await prisma.recognizedCandidate.update({
    where: { id: c.req.param("cId") },
    data: {
      name: body.name,
      producer: body.producer,
      vintage: body.vintage,
      region: body.region,
      country: body.country,
      type: body.type,
    },
  });
  return c.json(candidate);
});

captureSessionsRouter.post("/:id/candidates/:cId/accept", async (c) => {
  const candidate = await prisma.recognizedCandidate.update({
    where: { id: c.req.param("cId") },
    data: { status: "accepted" },
  });
  return c.json(candidate);
});

captureSessionsRouter.post("/:id/candidates/:cId/reject", async (c) => {
  const candidate = await prisma.recognizedCandidate.update({
    where: { id: c.req.param("cId") },
    data: { status: "rejected" },
  });
  return c.json(candidate);
});

captureSessionsRouter.post("/:id/finalize", async (c) => {
  const sessionId = c.req.param("id");
  const session = await prisma.captureSession.findUnique({
    where: { id: sessionId },
    include: { candidates: { include: { photo: true } } },
  });
  if (!session) return c.json({ error: "Nicht gefunden." }, 404);
  if (session.status === "completed") return c.json({ error: "Bereits abgeschlossen." }, 409);

  const body = await c.req.json<FinalizeRequest>();
  const now = new Date().toISOString();
  let created = 0;
  let merged = 0;

  await prisma.$transaction(async (tx) => {
    for (const save of body.saves ?? []) {
      const candidate = session.candidates.find((item) => item.id === save.candidateId);
      if (!candidate) continue;

      const qty = Math.max(1, save.quantity ?? 1);
      const fields = save.fields ?? {};

      if (save.action === "create") {
        const wineId = createId();
        const wineName = fields.name ?? candidate.name ?? "Unbekannt";
        const wineProducer = fields.producer ?? candidate.producer ?? "";
        const wineVintage = fields.vintage ?? candidate.vintage ?? 0;
        const wineType = fields.type ?? candidate.type ?? "rot";

        await tx.wine.create({
          data: {
            id: wineId,
            name: wineName,
            producer: wineProducer,
            vintage: wineVintage,
            region: fields.region ?? candidate.region ?? "",
            country: fields.country ?? candidate.country ?? "",
            type: wineType,
            grape: "",
            quantity: qty,
            notes: fields.notes ?? null,
          },
        });
        // storageKey prefixed with "capture-ref/" marks a shared photo reference —
        // the object lives under capture_photos and must not be deleted when this WineImage is removed.
        await tx.wineImage.create({
          data: {
            id: createId(),
            wineId,
            storageKey: `capture-ref/${candidate.photo.storageKey}/${candidate.id}`,
            url: candidate.photo.url,
            label: "Erfassung",
            isPrimary: true,
            bytes: candidate.photo.bytes,
          },
        });
        await tx.cellarMovement.create({
          data: {
            id: createId(),
            type: "in",
            wineId,
            wineName,
            wineProducer,
            wineVintage,
            wineType,
            quantity: qty,
            date: now,
            occasion: "Keller-Ersterfassung",
          },
        });
        await tx.recognizedCandidate.update({
          where: { id: candidate.id },
          data: { status: "accepted", linkedWineId: wineId },
        });
        created++;
      } else if (save.action === "addToExisting" && save.wineId) {
        const existing = await tx.wine.findUnique({ where: { id: save.wineId } });
        if (!existing) continue;
        await tx.wine.update({
          where: { id: save.wineId },
          data: { quantity: { increment: qty } },
        });
        await tx.cellarMovement.create({
          data: {
            id: createId(),
            type: "in",
            wineId: save.wineId,
            wineName: existing.name,
            wineProducer: existing.producer,
            wineVintage: existing.vintage,
            wineType: existing.type,
            quantity: qty,
            date: now,
            occasion: "Keller-Ersterfassung",
          },
        });
        await tx.recognizedCandidate.update({
          where: { id: candidate.id },
          data: { status: "merged", linkedWineId: save.wineId },
        });
        merged++;
      }
    }
    await tx.captureSession.update({ where: { id: sessionId }, data: { status: "completed" } });
  });

  return c.json({ created, merged, status: "completed" });
});
