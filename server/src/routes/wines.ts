import { Router } from "express";
import { randomUUID } from "crypto";
import pool from "../db.js";
import type { RowDataPacket } from "mysql2";

const router = Router();

// snake_case DB row -> camelCase frontend
function toFrontend(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    producer: row.producer,
    vintage: row.vintage,
    region: row.region,
    country: row.country,
    type: row.type,
    grape: row.grape,
    quantity: row.quantity,
    purchasePrice: Number(row.purchase_price),
    purchaseDate: row.purchase_date || "",
    purchaseLocation: row.purchase_location || "",
    drinkFrom: row.drink_from,
    drinkUntil: row.drink_until,
    rating: row.rating ?? undefined,
    personalRating: row.personal_rating ?? undefined,
    notes: row.notes || "",
    imageUrl: row.image_url || "",
    isGift: Boolean(row.is_gift),
    giftFrom: row.gift_from || "",
  };
}

// GET /api/wines
router.get("/", async (_req, res) => {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT * FROM wines ORDER BY created_at DESC"
  );
  res.json(rows.map(toFrontend));
});

// POST /api/wines
router.post("/", async (req, res) => {
  const w = req.body;
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO wines (id, name, producer, vintage, region, country, type, grape,
      quantity, purchase_price, purchase_date, purchase_location,
      drink_from, drink_until, rating, personal_rating, notes, image_url,
      is_gift, gift_from)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, w.name, w.producer, w.vintage, w.region || "", w.country || "",
      w.type, w.grape || "", w.quantity || 0, w.purchasePrice || 0,
      w.purchaseDate || "", w.purchaseLocation || "",
      w.drinkFrom ?? null, w.drinkUntil ?? null,
      w.rating ?? null, w.personalRating ?? null,
      w.notes || "", w.imageUrl || "",
      w.isGift ? 1 : 0, w.giftFrom || "",
    ]
  );
  res.status(201).json({ ...w, id });
});

// PUT /api/wines/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const w = req.body;

  const fields: string[] = [];
  const values: unknown[] = [];

  const mapping: Record<string, string> = {
    name: "name", producer: "producer", vintage: "vintage",
    region: "region", country: "country", type: "type", grape: "grape",
    quantity: "quantity", purchasePrice: "purchase_price",
    purchaseDate: "purchase_date", purchaseLocation: "purchase_location",
    drinkFrom: "drink_from", drinkUntil: "drink_until",
    rating: "rating", personalRating: "personal_rating",
    notes: "notes", imageUrl: "image_url",
    isGift: "is_gift", giftFrom: "gift_from",
  };

  for (const [jsKey, dbCol] of Object.entries(mapping)) {
    if (jsKey in w) {
      fields.push(`${dbCol} = ?`);
      values.push(jsKey === "isGift" ? (w[jsKey] ? 1 : 0) : w[jsKey]);
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  values.push(id);
  await pool.execute(
    `UPDATE wines SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  res.json({ id, ...w });
});

// DELETE /api/wines/:id
router.delete("/:id", async (req, res) => {
  await pool.execute("DELETE FROM wines WHERE id = ?", [req.params.id]);
  res.status(204).end();
});

export default router;
