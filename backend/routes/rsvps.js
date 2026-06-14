const express = require("express");
const pool = require("../db");
const { organizerOwnsEvent } = require("../ownership");

const router = express.Router();
const allowedStatuses = ["Attending", "Not Attending", "Maybe", "No Response"];

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM rsvps ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    res.status(500).json({ error: "Failed to fetch RSVPs" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    if (!(await organizerOwnsEvent(pool, req.params.eventId, req.query.organizer_id))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const result = await pool.query("SELECT * FROM rsvps WHERE event_id = $1 ORDER BY id ASC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event RSVPs:", error);
    res.status(500).json({ error: "Failed to fetch event RSVPs" });
  }
});

router.get("/guest/:guestId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM rsvps WHERE guest_id = $1 ORDER BY id ASC", [
      req.params.guestId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guest RSVP:", error);
    res.status(500).json({ error: "Failed to fetch guest RSVP" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid RSVP status" });
  }

  try {
    const result = await pool.query(
      "UPDATE rsvps SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "RSVP not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating RSVP status:", error);
    res.status(500).json({ error: "Failed to update RSVP status" });
  }
});

module.exports = router;
