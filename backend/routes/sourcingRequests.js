const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedStatuses = ["Pending", "Accepted", "Declined"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  const { organizer_id } = req.query;
  const values = [];
  const filters = [];

  if (organizer_id) {
    if (!/^\d+$/.test(organizer_id)) {
      return res.status(400).json({ error: "Invalid organizer_id" });
    }

    values.push(organizer_id);
    filters.push(`sourcing_requests.organizer_id = $${values.length}`);
  }

  try {
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT
        sourcing_requests.*,
        sourcing_requests.delivery_date::text AS delivery_date,
        events.name AS event_name,
        vendors.company_name AS vendor_name
      FROM sourcing_requests
      JOIN events ON events.id = sourcing_requests.event_id
      JOIN vendors ON vendors.id = sourcing_requests.vendor_id
      ${whereClause}
      ORDER BY sourcing_requests.created_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching sourcing requests:", error);
    res.status(500).json({ error: "Failed to fetch sourcing requests" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM sourcing_requests WHERE event_id = $1 ORDER BY created_at DESC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event sourcing requests:", error);
    res.status(500).json({ error: "Failed to fetch event sourcing requests" });
  }
});

router.get("/vendor/:vendorId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM sourcing_requests WHERE vendor_id = $1 ORDER BY created_at DESC", [
      req.params.vendorId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor sourcing requests:", error);
    res.status(500).json({ error: "Failed to fetch vendor sourcing requests" });
  }
});

router.post("/", async function (req, res) {
  const {
    event_id,
    vendor_id,
    organizer_id,
    requested_items,
    quantity,
    delivery_date,
    event_location,
    notes,
    clarification_note,
  } = req.body;

  if (isMissing(event_id) || isMissing(vendor_id) || isMissing(organizer_id) || isMissing(requested_items)) {
    return res.status(400).json({ error: "event_id, vendor_id, organizer_id, and requested_items are required" });
  }

  if (isMissing(quantity) || isMissing(delivery_date) || isMissing(event_location)) {
    return res.status(400).json({ error: "quantity, delivery_date, and event_location are required" });
  }

  try {
    const eventResult = await pool.query(
      "SELECT 1 FROM events WHERE id = $1 AND organizer_id = $2",
      [event_id, organizer_id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(400).json({ error: "Selected event does not belong to this organizer" });
    }

    const vendorResult = await pool.query(
      "SELECT 1 FROM vendors WHERE id = $1 AND status = 'Active'",
      [vendor_id]
    );

    if (vendorResult.rows.length === 0) {
      return res.status(400).json({ error: "Selected vendor is not active" });
    }

    const dateResult = await pool.query(
      "SELECT $1::date >= CURRENT_DATE AS valid_delivery_date",
      [delivery_date]
    );

    if (!dateResult.rows[0].valid_delivery_date) {
      return res.status(400).json({ error: "delivery_date cannot be in the past" });
    }

    const result = await pool.query(
      `INSERT INTO sourcing_requests (
        event_id, vendor_id, organizer_id, requested_items, quantity, delivery_date,
        event_location, notes, clarification_note, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')
      RETURNING *`,
      [
        event_id,
        vendor_id,
        organizer_id,
        requested_items,
        quantity || null,
        delivery_date || null,
        event_location || null,
        notes || null,
        clarification_note || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating sourcing request:", error);
    res.status(500).json({ error: "Failed to create sourcing request" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid sourcing request status" });
  }

  try {
    const result = await pool.query("UPDATE sourcing_requests SET status = $1 WHERE id = $2 RETURNING *", [
      status,
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sourcing request not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating sourcing request status:", error);
    res.status(500).json({ error: "Failed to update sourcing request status" });
  }
});

module.exports = router;
