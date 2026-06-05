const express = require("express");
const pool = require("../db");

const router = express.Router();

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM guests ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({ error: "Failed to fetch guests" });
  }
});

router.get("/search", async function (req, res) {
  const { name, email, dietary_preference, event_id } = req.query;
  const filters = [];
  const values = [];

  if (name) {
    values.push(`%${name}%`);
    filters.push(`full_name ILIKE $${values.length}`);
  }

  if (email) {
    values.push(`%${email}%`);
    filters.push(`email ILIKE $${values.length}`);
  }

  if (dietary_preference) {
    values.push(`%${dietary_preference}%`);
    filters.push(`dietary_preferences ILIKE $${values.length}`);
  }

  if (event_id) {
    values.push(event_id);
    filters.push(`event_id = $${values.length}`);
  }

  try {
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(`SELECT * FROM guests ${whereClause} ORDER BY id ASC`, values);
    res.json(result.rows);
  } catch (error) {
    console.error("Error searching guests:", error);
    res.status(500).json({ error: "Failed to search guests" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM guests WHERE event_id = $1 ORDER BY id ASC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event guests:", error);
    res.status(500).json({ error: "Failed to fetch event guests" });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM guests WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching guest:", error);
    res.status(500).json({ error: "Failed to fetch guest" });
  }
});

router.post("/", async function (req, res) {
  const {
    event_id,
    user_id,
    full_name,
    email,
    phone,
    dietary_preferences,
    special_requirements,
    notes,
  } = req.body;

  if (isMissing(event_id) || isMissing(full_name)) {
    return res.status(400).json({ error: "event_id and full_name are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO guests (
        event_id, user_id, full_name, email, phone, dietary_preferences, special_requirements, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        event_id,
        user_id || null,
        full_name,
        email || null,
        phone || null,
        dietary_preferences || null,
        special_requirements || null,
        notes || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating guest:", error);
    res.status(500).json({ error: "Failed to create guest" });
  }
});

router.put("/:id", async function (req, res) {
  const {
    event_id,
    user_id,
    full_name,
    email,
    phone,
    dietary_preferences,
    special_requirements,
    notes,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE guests
      SET
        event_id = COALESCE($1, event_id),
        user_id = COALESCE($2, user_id),
        full_name = COALESCE($3, full_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        dietary_preferences = COALESCE($6, dietary_preferences),
        special_requirements = COALESCE($7, special_requirements),
        notes = COALESCE($8, notes)
      WHERE id = $9
      RETURNING *`,
      [
        event_id || null,
        user_id || null,
        full_name || null,
        email || null,
        phone || null,
        dietary_preferences || null,
        special_requirements || null,
        notes || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating guest:", error);
    res.status(500).json({ error: "Failed to update guest" });
  }
});

module.exports = router;
