const express = require("express");
const pool = require("../db");
const { venueOwnerOwnsVenue } = require("../ownership");

const router = express.Router();

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT
        id,
        venue_id,
        available_date::text AS available_date,
        is_available,
        price_override,
        notes,
        created_at
      FROM venue_availability
      ORDER BY available_date ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching venue availability:", error);
    res.status(500).json({ error: "Failed to fetch venue availability" });
  }
});

router.get("/venue/:venueId", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT
        id,
        venue_id,
        available_date::text AS available_date,
        is_available,
        price_override,
        notes,
        created_at
      FROM venue_availability
      WHERE venue_id = $1
      ORDER BY available_date ASC`,
      [req.params.venueId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching venue availability:", error);
    res.status(500).json({ error: "Failed to fetch venue availability" });
  }
});

router.get("/owner/:ownerId", async function (req, res) {
  if (!/^\d+$/.test(String(req.params.ownerId || ""))) {
    return res.status(400).json({ error: "Valid owner id is required" });
  }

  try {
    const result = await pool.query(
      `SELECT
        venue_availability.id,
        venue_availability.venue_id,
        venues.name AS venue_name,
        venue_availability.available_date::text AS available_date,
        venue_availability.is_available,
        venue_availability.price_override,
        venue_availability.notes,
        venue_availability.created_at
      FROM venue_availability
      JOIN venues ON venues.id = venue_availability.venue_id
      WHERE venues.owner_id = $1
      ORDER BY venue_availability.available_date ASC, venues.name ASC`,
      [req.params.ownerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching owner venue availability:", error);
    res.status(500).json({ error: "Failed to fetch owner venue availability" });
  }
});

router.get("/date/:date", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT venues.*, venue_availability.available_date::text AS available_date, venue_availability.price_override
      FROM venue_availability
      JOIN venues ON venues.id = venue_availability.venue_id
      WHERE venue_availability.available_date = $1::date
        AND venue_availability.is_available = TRUE
        AND venues.status = 'Active'
      ORDER BY venues.id ASC`,
      [req.params.date]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching available venues by date:", error);
    res.status(500).json({ error: "Failed to fetch available venues by date" });
  }
});

router.post("/", async function (req, res) {
  const { owner_id, venue_id, available_date, is_available, price_override, notes } = req.body;

  if (isMissing(owner_id) || isMissing(venue_id) || isMissing(available_date)) {
    return res.status(400).json({ error: "owner_id, venue_id, and available_date are required" });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(available_date))) {
    return res.status(400).json({ error: "available_date must use YYYY-MM-DD format" });
  }

  try {
    if (!(await venueOwnerOwnsVenue(pool, venue_id, owner_id))) {
      return res.status(403).json({ error: "You can only manage availability for your own venues" });
    }

    const result = await pool.query(
      `INSERT INTO venue_availability (
        venue_id, available_date, is_available, price_override, notes
      )
      VALUES ($1, $2::date, COALESCE($3, TRUE), $4, $5)
      ON CONFLICT (venue_id, available_date)
      DO UPDATE SET
        is_available = EXCLUDED.is_available,
        price_override = EXCLUDED.price_override,
        notes = EXCLUDED.notes
      RETURNING
        id,
        venue_id,
        available_date::text AS available_date,
        is_available,
        price_override,
        notes,
        created_at`,
      [
        venue_id,
        available_date,
        is_available === undefined ? true : is_available,
        price_override || null,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error saving venue availability:", error);
    res.status(500).json({ error: "Failed to save venue availability" });
  }
});

router.patch("/:id", async function (req, res) {
  const { owner_id, is_available, price_override, notes } = req.body;

  if (isMissing(owner_id)) {
    return res.status(400).json({ error: "owner_id is required" });
  }

  if (is_available === undefined) {
    return res.status(400).json({ error: "is_available is required" });
  }

  try {
    const existingResult = await pool.query(
      "SELECT venue_id FROM venue_availability WHERE id = $1",
      [req.params.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: "Availability date not found" });
    }

    if (!(await venueOwnerOwnsVenue(pool, existingResult.rows[0].venue_id, owner_id))) {
      return res.status(403).json({ error: "You can only manage availability for your own venues" });
    }

    const result = await pool.query(
      `UPDATE venue_availability
      SET
        is_available = $1,
        price_override = $2,
        notes = $3
      WHERE id = $4
      RETURNING
        id,
        venue_id,
        available_date::text AS available_date,
        is_available,
        price_override,
        notes,
        created_at`,
      [is_available, price_override || null, notes || null, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating venue availability:", error);
    res.status(500).json({ error: "Failed to update venue availability" });
  }
});

module.exports = router;
