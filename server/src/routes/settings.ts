import { Router } from "express";
import pool from "../db.js";
import type { RowDataPacket } from "mysql2";

const router = Router();

// GET /api/settings
router.get("/", async (_req, res) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT cellar_name FROM settings WHERE id = 1"
  );
  const row = rows[0];
  res.json({ cellarName: row?.cellar_name || "Yves Weinkeller" });
});

// PUT /api/settings
router.put("/", async (req, res) => {
  const { cellarName } = req.body;
  if (cellarName !== undefined) {
    await pool.execute(
      "UPDATE settings SET cellar_name = ? WHERE id = 1",
      [cellarName]
    );
  }
  res.json({ cellarName });
});

export default router;
