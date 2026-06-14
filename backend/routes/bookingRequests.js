const express = require("express");
const pool = require("../db");
const { organizerOwnsEvent } = require("../ownership");

const router = express.Router();
const allowedStatuses = ["Pending", "Approved", "Declined", "Counter Proposal"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const organizerId = req.query.organizer_id;
    if (!/^\d+$/.test(String(organizerId || ""))) {
      return res.status(400).json({ error: "organizer_id is required" });
    }

    const result = await pool.query(
      `SELECT
        booking_requests.*,
        booking_requests.requested_date::text AS requested_date,
        events.name AS event_name,
        venues.name AS venue_name
      FROM booking_requests
      JOIN events ON events.id = booking_requests.event_id
      JOIN venues ON venues.id = booking_requests.venue_id
      WHERE events.organizer_id = $1
      ORDER BY booking_requests.created_at DESC`
      ,
      [organizerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching booking requests:", error);
    res.status(500).json({ error: "Failed to fetch booking requests" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    if (!(await organizerOwnsEvent(pool, req.params.eventId, req.query.organizer_id))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const result = await pool.query(
      `SELECT
        booking_requests.*,
        booking_requests.requested_date::text AS requested_date,
        events.name AS event_name,
        venues.name AS venue_name
      FROM booking_requests
      JOIN events ON events.id = booking_requests.event_id
      JOIN venues ON venues.id = booking_requests.venue_id
      WHERE booking_requests.event_id = $1
      ORDER BY booking_requests.created_at DESC`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event booking requests:", error);
    res.status(500).json({ error: "Failed to fetch event booking requests" });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT
        booking_requests.*,
        booking_requests.requested_date::text AS requested_date,
        events.name AS event_name,
        venues.name AS venue_name
      FROM booking_requests
      JOIN events ON events.id = booking_requests.event_id
      JOIN venues ON venues.id = booking_requests.venue_id
      WHERE booking_requests.id = $1`,
      [req.params.id]
    );

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
    if (!(await organizerOwnsEvent(pool, event_id, organizer_id))) {
      return res.status(403).json({ error: "You can only book venues for your own events" });
    }

    const availabilityResult = await pool.query(
      `SELECT 1
      FROM venue_availability
      JOIN venues ON venues.id = venue_availability.venue_id
      WHERE venue_availability.venue_id = $1
        AND venue_availability.available_date = $2
        AND venue_availability.is_available = TRUE
        AND venues.status = 'Active'`,
      [venue_id, requested_date]
    );

    if (availabilityResult.rows.length === 0) {
      return res.status(400).json({
        error: "Venue is not available on the requested date",
      });
    }

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
