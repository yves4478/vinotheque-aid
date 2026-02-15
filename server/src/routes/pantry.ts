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
    location: row.location || "",
    expiryDate: row.expiry_date || "",
    purchasePrice: Number(row.purchase_price),
    notes: row.notes || "",
  };
}

// GET /api/pantry
router.get("/", async (_req, res) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM pantry_items ORDER BY created_at DESC"
  );
  res.json(rows.map(toFrontend));
});

// POST /api/pantry
router.post("/", async (req, res) => {
  const item = req.body;
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO pantry_items (id, name, category, quantity, unit, location, expiry_date, purchase_price, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, item.name, item.category || "", item.quantity || 0,
      item.unit || "Stück", item.location || "", item.expiryDate || "",
      item.purchasePrice || 0, item.notes || "",
    ]
  );
  res.status(201).json({ ...item, id });
});

// PUT /api/pantry/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const item = req.body;

  const fields: string[] = [];
  const values: unknown[] = [];

  const mapping: Record<string, string> = {
    name: "name",
    category: "category",
    quantity: "quantity",
    unit: "unit",
    location: "location",
    expiryDate: "expiry_date",
    purchasePrice: "purchase_price",
    notes: "notes",
  };

  for (const [jsKey, dbCol] of Object.entries(mapping)) {
    if (jsKey in item) {
      fields.push(`${dbCol} = ?`);
      values.push(item[jsKey]);
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  values.push(id);
  await pool.execute(
    `UPDATE pantry_items SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  res.json({ id, ...item });
});

// DELETE /api/pantry/:id
router.delete("/:id", async (req, res) => {
  await pool.execute("DELETE FROM pantry_items WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

export default router;
