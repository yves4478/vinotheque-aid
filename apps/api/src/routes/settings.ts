import { Hono } from "hono";
import prisma from "../db";

export const settingsRouter = new Hono();

settingsRouter.get("/", async (c) => {
  const settings = await prisma.appSetting.findUnique({ where: { key: "global" } });
  return c.json(settings?.value ?? {});
});

settingsRouter.put("/", async (c) => {
  const data = await c.req.json();
  const settings = await prisma.appSetting.upsert({
    where: { key: "global" },
    create: { key: "global", value: data },
    update: { value: data },
  });
  return c.json(settings.value);
});
