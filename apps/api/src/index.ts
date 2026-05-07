import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { winesRouter } from "./routes/wines";
import { wishlistRouter } from "./routes/wishlist";
import { shoppingRouter } from "./routes/shopping";
import { consumedRouter } from "./routes/consumed";
import { getRuntimeConfig, requireFeature, updateRuntimeConfig } from "./runtime";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/api/runtime-config", async (c) => c.json(await getRuntimeConfig()));
app.put("/api/runtime-config", async (c) => {
  try {
    const body = await c.req.json();
    return c.json(await updateRuntimeConfig(body));
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : "Feature-Flags konnten nicht gespeichert werden.",
    }, 400);
  }
});

app.use("/api/wines", requireFeature("inventory"));
app.use("/api/wines/*", requireFeature("inventory"));
app.use("/api/consumed", requireFeature("inventory"));
app.use("/api/consumed/*", requireFeature("inventory"));
app.use("/api/wishlist", requireFeature("wishlist"));
app.use("/api/wishlist/*", requireFeature("wishlist"));
app.use("/api/shopping", requireFeature("shopping"));
app.use("/api/shopping/*", requireFeature("shopping"));

app.route("/api/wines", winesRouter);
app.route("/api/wishlist", wishlistRouter);
app.route("/api/shopping", shoppingRouter);
app.route("/api/consumed", consumedRouter);

app.get("/health", async (c) => {
  const runtimeConfig = await getRuntimeConfig();
  return c.json({
    ok: true,
    environment: runtimeConfig.environment,
    enabledFeatures: runtimeConfig.features.filter((feature) => feature.enabled).map((feature) => feature.key),
    timestamp: new Date().toISOString(),
  });
});

const port = parseInt(process.env.PORT ?? "3000");
serve({ fetch: app.fetch, port }, () => {
  console.log(`Vinotheque API listening on port ${port}`);
});
