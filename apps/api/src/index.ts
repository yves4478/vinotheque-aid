import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { winesRouter } from "./routes/wines";
import { wishlistRouter } from "./routes/wishlist";
import { shoppingRouter } from "./routes/shopping";
import { consumedRouter } from "./routes/consumed";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.route("/api/wines", winesRouter);
app.route("/api/wishlist", wishlistRouter);
app.route("/api/shopping", shoppingRouter);
app.route("/api/consumed", consumedRouter);

app.get("/health", (c) =>
  c.json({ ok: true, timestamp: new Date().toISOString() }),
);

const port = parseInt(process.env.PORT ?? "3000");
serve({ fetch: app.fetch, port }, () => {
  console.log(`Vinotheque API listening on port ${port}`);
});
