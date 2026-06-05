const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedStatuses = ["Pending", "Approved", "Declined", "Counter Proposal"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM booking_requests ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching booking requests:", error);
    res.status(500).json({ error: "Failed to fetch booking requests" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM booking_requests WHERE event_id = $1 ORDER BY created_at DESC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event booking requests:", error);
    res.status(500).json({ error: "Failed to fetch event booking requests" });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM booking_requests WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking request not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching booking request:", error);
    res.status(500).json({ error: "Failed to fetch booking request" });
  }
});

router.post("/", async function (req, res) {
  const {
    event_id,
    venue_id,
    organizer_id,
    requested_date,
    expected_attendees,
    special_requirements,
    proposed_price,
    counter_proposal,
    status,
  } = req.body;

  if (isMissing(event_id) || isMissing(venue_id) || isMissing(organizer_id) || isMissing(requested_date)) {
    return res.status(400).json({ error: "event_id, venue_id, organizer_id, and requested_date are required" });
  }

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid booking request status" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO booking_requests (
        event_id, venue_id, organizer_id, requested_date, expected_attendees,
        special_requirements, proposed_price, counter_proposal, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'Pending'))
      RETURNING *`,
      [
        event_id,
        venue_id,
        organizer_id,
        requested_date,
        expected_attendees || null,
        special_requirements || null,
        proposed_price || null,
        counter_proposal || null,
        status || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating booking request:", error);
    res.status(500).json({ error: "Failed to create booking request" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid booking request status" });
  }

  try {
    const result = await pool.query("UPDATE booking_requests SET status = $1 WHERE id = $2 RETURNING *", [
      status,
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking request not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating booking request status:", error);
    res.status(500).json({ error: "Failed to update booking request status" });
  }
});

module.exports = router;
