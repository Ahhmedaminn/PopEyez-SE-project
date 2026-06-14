const express = require("express");
const pool = require("../db");

const router = express.Router();

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM venues WHERE status = 'Active' ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ error: "Failed to fetch venues" });
  }
});

router.get("/search", async function (req, res) {
  const { city, minCapacity, maxPrice, date } = req.query;
  const filters = ["venues.status = 'Active'"];
  const values = [];

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date must use YYYY-MM-DD format" });
  }

  if (city) {
    values.push(city);
    filters.push(`venues.city ILIKE $${values.length}`);
  }

  if (minCapacity) {
    values.push(minCapacity);
    filters.push(`venues.capacity >= $${values.length}`);
  }

  if (maxPrice) {
    values.push(maxPrice);
    filters.push(`COALESCE(venue_availability.price_override, venues.daily_price) <= $${values.length}`);
  }

  if (date) {
    values.push(date);
    filters.push(`venue_availability.available_date = $${values.length}::date`);
    filters.push("venue_availability.is_available = TRUE");
  }

  try {
    const result = await pool.query(
      `SELECT
        venues.*,
        venue_availability.available_date,
        venue_availability.price_override,
        venue_availability.notes AS availability_notes
      FROM venues
      ${date
        ? "INNER JOIN venue_availability ON venue_availability.venue_id = venues.id"
        : "LEFT JOIN venue_availability ON FALSE"}
      WHERE ${filters.join(" AND ")}
      ORDER BY venues.id ASC`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error searching venues:", error);
    res.status(500).json({ error: "Failed to search venues" });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM venues WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching venue:", error);
    res.status(500).json({ error: "Failed to fetch venue" });
  }
});

router.post("/", async function (req, res) {
  const {
    owner_id,
    name,
    description,
    location,
    city,
    capacity,
    dimensions_sqm,
    amenities,
    daily_price,
    photo_url,
    floor_plan_url,
  } = req.body;

  if (
    isMissing(owner_id)
    || isMissing(name)
    || isMissing(location)
    || isMissing(city)
    || isMissing(capacity)
  ) {
    return res.status(400).json({
      error: "owner_id, name, location, city, and capacity are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO venues (
        owner_id, name, description, location, city, capacity, dimensions_sqm,
        amenities, daily_price, photo_url, floor_plan_url, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Active')
      RETURNING *`,
      [
        owner_id,
        name,
        description || null,
        location,
        city,
        capacity,
        dimensions_sqm || null,
        amenities || null,
        daily_price || null,
        photo_url || null,
        floor_plan_url || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating venue:", error);
    res.status(500).json({ error: "Failed to create venue" });
  }
});

module.exports = router;
