import { Hono } from "hono";
import prisma from "../db";
import { validateImagesPayload } from "../images";

export const wishlistRouter = new Hono();

wishlistRouter.get("/", async (c) => {
  const items = await prisma.wishlistItem.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return c.json(items);
});

wishlistRouter.post("/", async (c) => {
  const payload = validateImagesPayload(await c.req.json());
  if (!payload.ok) {
    return c.json({ error: payload.error }, 400);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { updatedAt: _u, ...data } = payload.data as any;
  const item = await prisma.wishlistItem.upsert({
    where: { id: data.id },
    create: data,
    update: data,
  });
  return c.json(item, 201);
});

wishlistRouter.put("/:id", async (c) => {
  const payload = validateImagesPayload(await c.req.json());
  if (!payload.ok) {
    return c.json({ error: payload.error }, 400);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { updatedAt: _u, id: _id, ...data } = payload.data as any;
  const item = await prisma.wishlistItem.update({
    where: { id: c.req.param("id") },
    data,
  });
  return c.json(item);
});

wishlistRouter.delete("/:id", async (c) => {
  await prisma.wishlistItem
    .delete({ where: { id: c.req.param("id") } })
    .catch(() => {});
  return c.json({ deleted: true });
});
