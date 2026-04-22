import { Hono } from "hono";
import prisma from "../db";

export const consumedRouter = new Hono();

consumedRouter.get("/", async (c) => {
  const items = await prisma.consumedWine.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return c.json(items);
});

consumedRouter.post("/", async (c) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { updatedAt: _u, ...data } = (await c.req.json()) as any;
  const item = await prisma.consumedWine.upsert({
    where: { id: data.id },
    create: data,
    update: data,
  });
  return c.json(item, 201);
});

consumedRouter.delete("/:id", async (c) => {
  await prisma.consumedWine
    .delete({ where: { id: c.req.param("id") } })
    .catch(() => {});
  return c.json({ deleted: true });
});
