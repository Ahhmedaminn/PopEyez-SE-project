const express = require("express");
const pool = require("../db");
const { organizerOwnsEvent, venueOwnerOwnsBookingRequest } = require("../ownership");

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

router.get("/venue-owner/:ownerId", async function (req, res) {
  if (!/^\d+$/.test(String(req.params.ownerId || ""))) {
    return res.status(400).json({ error: "Valid owner id is required" });
  }

  try {
    const result = await pool.query(
      `SELECT
        booking_requests.*,
        booking_requests.requested_date::text AS requested_date,
        events.name AS event_name,
        events.event_type,
        events.event_date::text AS event_date,
        users.full_name AS organizer_name,
        users.email AS organizer_email,
        users.phone AS organizer_phone,
        venues.name AS venue_name
      FROM booking_requests
      JOIN events ON events.id = booking_requests.event_id
      JOIN users ON users.id = booking_requests.organizer_id
      JOIN venues ON venues.id = booking_requests.venue_id
      WHERE venues.owner_id = $1
      ORDER BY booking_requests.created_at DESC`,
      [req.params.ownerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching venue owner booking requests:", error);
    res.status(500).json({ error: "Failed to fetch venue owner booking requests" });
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

router.patch("/:id/owner-response", async function (req, res) {
  const { owner_id, status, counter_proposal } = req.body;

  if (isMissing(owner_id)) {
    return res.status(400).json({ error: "owner_id is required" });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid booking request status" });
  }

  if (status === "Counter Proposal" && isMissing(counter_proposal)) {
    return res.status(400).json({ error: "counter_proposal is required for counter proposals" });
  }

  try {
    if (!(await venueOwnerOwnsBookingRequest(pool, req.params.id, owner_id))) {
      return res.status(403).json({ error: "You can only respond to requests for your own venues" });
    }

    const currentResult = await pool.query(
      "SELECT status FROM booking_requests WHERE id = $1",
      [req.params.id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking request not found" });
    }

    if (["Approved", "Declined"].includes(currentResult.rows[0].status)) {
      return res.status(400).json({ error: "Approved or declined requests are final in this MVP" });
    }

    const result = await pool.query(
      `UPDATE booking_requests
      SET
        status = $1,
        counter_proposal = CASE WHEN $2::text IS NULL THEN counter_proposal ELSE $2 END
      WHERE id = $3
      RETURNING *`,
      [status, counter_proposal || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking request not found" });
    }

    if (status === "Approved") {
      await pool.query(
        "UPDATE events SET venue_id = $1 WHERE id = $2",
        [result.rows[0].venue_id, result.rows[0].event_id]
      );

      await pool.query(
        `UPDATE venue_availability
        SET
          is_available = FALSE,
          notes = COALESCE(notes || ' ', '') || 'Approved booking request #' || $1 || '.'
        WHERE venue_id = $2
          AND available_date = $3::date`,
        [result.rows[0].id, result.rows[0].venue_id, result.rows[0].requested_date]
      );

      await pool.query(
        `UPDATE booking_requests
        SET
          status = 'Declined',
          counter_proposal = COALESCE(counter_proposal, 'Automatically declined because another request was approved for this venue and date.')
        WHERE id <> $1
          AND venue_id = $2
          AND requested_date = $3::date
          AND status IN ('Pending', 'Counter Proposal')`,
        [result.rows[0].id, result.rows[0].venue_id, result.rows[0].requested_date]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating booking request owner response:", error);
    res.status(500).json({ error: "Failed to update booking request owner response" });
  }
});

router.patch("/:id/organizer-counter-response", async function (req, res) {
  const { organizer_id, response } = req.body;

  if (isMissing(organizer_id)) {
    return res.status(400).json({ error: "organizer_id is required" });
  }

  if (!["Accepted", "Declined"].includes(response)) {
    return res.status(400).json({ error: "response must be Accepted or Declined" });
  }

  try {
    const currentResult = await pool.query(
      `SELECT *
      FROM booking_requests
      WHERE id = $1
        AND organizer_id = $2`,
      [req.params.id, organizer_id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Booking request not found" });
    }

    const currentRequest = currentResult.rows[0];

    if (currentRequest.status !== "Counter Proposal") {
      return res.status(400).json({ error: "Only counter proposals can be accepted or declined by the organizer" });
    }

    const nextStatus = response === "Accepted" ? "Approved" : "Declined";
    const result = await pool.query(
      `UPDATE booking_requests
      SET status = $1
      WHERE id = $2
      RETURNING *`,
      [nextStatus, req.params.id]
    );

    if (nextStatus === "Approved") {
      await pool.query(
        "UPDATE events SET venue_id = $1 WHERE id = $2",
        [currentRequest.venue_id, currentRequest.event_id]
      );

      await pool.query(
        `UPDATE venue_availability
        SET
          is_available = FALSE,
          notes = COALESCE(notes || ' ', '') || 'Organizer accepted counter-proposal for booking request #' || $1 || '.'
        WHERE venue_id = $2
          AND available_date = $3::date`,
        [currentRequest.id, currentRequest.venue_id, currentRequest.requested_date]
      );

      await pool.query(
        `UPDATE booking_requests
        SET
          status = 'Declined',
          counter_proposal = COALESCE(counter_proposal, 'Automatically declined because another request was approved for this venue and date.')
        WHERE id <> $1
          AND venue_id = $2
          AND requested_date = $3::date
          AND status IN ('Pending', 'Counter Proposal')`,
        [currentRequest.id, currentRequest.venue_id, currentRequest.requested_date]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating organizer counter response:", error);
    res.status(500).json({ error: "Failed to update counter-proposal response" });
  }
});

module.exports = router;
