const express = require("express");
const pool = require("../db");
const { venueOwnerOwnsVenue } = require("../ownership");

const router = express.Router();
const allowedStatuses = ["Active", "Inactive"];

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

router.get("/owner/:ownerId", async function (req, res) {
  if (!/^\d+$/.test(String(req.params.ownerId || ""))) {
    return res.status(400).json({ error: "Valid owner id is required" });
  }

  try {
    const result = await pool.query(
      `SELECT *
      FROM venues
      WHERE owner_id = $1
      ORDER BY status ASC, id ASC`,
      [req.params.ownerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching owner venues:", error);
    res.status(500).json({ error: "Failed to fetch owner venues" });
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

router.put("/:id", async function (req, res) {
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

  if (isMissing(owner_id)) {
    return res.status(400).json({ error: "owner_id is required" });
  }

  if (
    isMissing(name)
    || isMissing(location)
    || isMissing(city)
    || isMissing(capacity)
  ) {
    return res.status(400).json({
      error: "name, location, city, and capacity are required",
    });
  }

  try {
    if (!(await venueOwnerOwnsVenue(pool, req.params.id, owner_id))) {
      return res.status(403).json({ error: "You can only update your own venue listings" });
    }

    const result = await pool.query(
      `UPDATE venues
      SET
        name = $1,
        description = $2,
        location = $3,
        city = $4,
        capacity = $5,
        dimensions_sqm = $6,
        amenities = $7,
        daily_price = $8,
        photo_url = $9,
        floor_plan_url = $10
      WHERE id = $11
        AND owner_id = $12
      RETURNING *`,
      [
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
        req.params.id,
        owner_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating venue:", error);
    res.status(500).json({ error: "Failed to update venue" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { owner_id, status } = req.body;

  if (isMissing(owner_id)) {
    return res.status(400).json({ error: "owner_id is required" });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid venue status" });
  }

  try {
    if (!(await venueOwnerOwnsVenue(pool, req.params.id, owner_id))) {
      return res.status(403).json({ error: "You can only change your own venue listings" });
    }

    const result = await pool.query(
      `UPDATE venues
      SET status = $1
      WHERE id = $2
        AND owner_id = $3
      RETURNING *`,
      [status, req.params.id, owner_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating venue status:", error);
    res.status(500).json({ error: "Failed to update venue status" });
  }
});

router.delete("/:id", async function (req, res) {
  const { owner_id } = req.body;

  if (isMissing(owner_id)) {
    return res.status(400).json({ error: "owner_id is required" });
  }

  try {
    if (!(await venueOwnerOwnsVenue(pool, req.params.id, owner_id))) {
      return res.status(403).json({ error: "You can only remove your own venue listings" });
    }

    const futureUsageResult = await pool.query(
      `SELECT
        (
          SELECT COUNT(*)::int
          FROM booking_requests
          WHERE venue_id = $1
            AND requested_date >= CURRENT_DATE
            AND status IN ('Pending', 'Approved', 'Counter Proposal')
        ) AS active_booking_requests,
        (
          SELECT COUNT(*)::int
          FROM events
          WHERE venue_id = $1
            AND event_date >= CURRENT_DATE
            AND status IN ('Planned', 'Ongoing')
        ) AS active_events`,
      [req.params.id]
    );
    const futureUsage = futureUsageResult.rows[0];

    if (futureUsage.active_booking_requests > 0 || futureUsage.active_events > 0) {
      return res.status(400).json({
        error: "This venue has future or active bookings/events. Deactivate it instead until those are no longer active.",
      });
    }

    const result = await pool.query(
      `DELETE FROM venues
      WHERE id = $1
        AND owner_id = $2
      RETURNING *`,
      [req.params.id, owner_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json({
      message: "Venue listing permanently removed.",
      venue: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting venue:", error);
    res.status(500).json({ error: "Failed to remove venue listing" });
  }
});

module.exports = router;
