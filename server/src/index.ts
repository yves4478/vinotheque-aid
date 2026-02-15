import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { migrate } from "./migrate.js";
import wineRoutes from "./routes/wines.js";
import shoppingRoutes from "./routes/shopping.js";
import settingsRoutes from "./routes/settings.js";
import pantryRoutes from "./routes/pantry.js";
import pantryShoppingRoutes from "./routes/pantryShopping.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/wines", wineRoutes);
app.use("/api/shopping", shoppingRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/pantry-shopping", pantryShoppingRoutes);

// Serve frontend static files in production
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// SPA fallback: all non-API routes serve index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

async function start() {
  // Run DB migrations on startup
  let retries = 10;
  while (retries > 0) {
    try {
      await migrate();
      break;
    } catch (err) {
      retries--;
      if (retries === 0) {
        console.error("Could not connect to database after retries:", err);
        process.exit(1);
      }
      console.log(`DB not ready, retrying in 3s... (${retries} left)`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
