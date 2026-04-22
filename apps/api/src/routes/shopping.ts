import { Hono } from "hono";
import prisma from "../db";

export const shoppingRouter = new Hono();

shoppingRouter.get("/", async (c) => {
  const items = await prisma.shoppingItem.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return c.json(items);
});

shoppingRouter.post("/", async (c) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { updatedAt: _u, ...data } = (await c.req.json()) as any;
  const item = await prisma.shoppingItem.upsert({
    where: { id: data.id },
    create: data,
    update: data,
  });
  return c.json(item, 201);
});

shoppingRouter.put("/:id", async (c) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { updatedAt: _u, id: _id, ...data } = (await c.req.json()) as any;
  const item = await prisma.shoppingItem.update({
    where: { id: c.req.param("id") },
    data,
  });
  return c.json(item);
});

shoppingRouter.delete("/:id", async (c) => {
  await prisma.shoppingItem
    .delete({ where: { id: c.req.param("id") } })
    .catch(() => {});
  return c.json({ deleted: true });
});
