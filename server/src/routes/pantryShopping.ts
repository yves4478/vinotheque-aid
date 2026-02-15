import { Router } from "express";
import { randomUUID } from "crypto";
import pool from "../db.js";
import type { RowDataPacket } from "mysql2";

const router = Router();

function toFrontend(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    category: row.category || "",
    quantity: row.quantity,
    unit: row.unit || "Stück",
    estimatedPrice: Number(row.estimated_price),
    reason: row.reason || "",
    checked: Boolean(row.checked),
  };
}

// GET /api/pantry-shopping
router.get("/", async (_req, res) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM pantry_shopping_items ORDER BY created_at DESC"
  );
  res.json(rows.map(toFrontend));
});

// POST /api/pantry-shopping
router.post("/", async (req, res) => {
  const item = req.body;
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO pantry_shopping_items (id, name, category, quantity, unit, estimated_price, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id, item.name, item.category || "", item.quantity || 1,
      item.unit || "Stück", item.estimatedPrice || 0, item.reason || "",
    ]
  );
  res.status(201).json({ ...item, id, checked: false });
});

// PUT /api/pantry-shopping/:id (toggle checked)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { checked } = req.body;

  if (typeof checked === "boolean") {
    await pool.execute(
      "UPDATE pantry_shopping_items SET checked = ? WHERE id = ?",
      [checked ? 1 : 0, id]
    );
  }
  res.json({ id, ...req.body });
});

// DELETE /api/pantry-shopping/:id
router.delete("/:id", async (req, res) => {
  await pool.execute("DELETE FROM pantry_shopping_items WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

export default router;
