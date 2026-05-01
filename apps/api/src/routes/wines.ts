import { Hono } from "hono";
import prisma from "../db";
import { validateImagesPayload } from "../images";

export const winesRouter = new Hono();

winesRouter.get("/", async (c) => {
  const wines = await prisma.wine.findMany({ orderBy: { updatedAt: "desc" } });
  return c.json(wines);
});

winesRouter.post("/", async (c) => {
  const payload = validateImagesPayload(await c.req.json());
  if (!payload.ok) {
    return c.json({ error: payload.error }, 400);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { updatedAt: _u, ...data } = payload.data as any;
  const wine = await prisma.wine.upsert({
    where: { id: data.id },
    create: data,
    update: data,
  });
  return c.json(wine, 201);
});

winesRouter.put("/:id", async (c) => {
  const payload = validateImagesPayload(await c.req.json());
  if (!payload.ok) {
    return c.json({ error: payload.error }, 400);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { updatedAt: _u, id: _id, ...data } = payload.data as any;
  const wine = await prisma.wine.update({
    where: { id: c.req.param("id") },
    data,
  });
  return c.json(wine);
});

winesRouter.delete("/:id", async (c) => {
  await prisma.wine.delete({ where: { id: c.req.param("id") } }).catch(() => {});
  return c.json({ deleted: true });
});
