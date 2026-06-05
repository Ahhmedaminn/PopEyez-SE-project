const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedEventStatuses = ["Planned", "Ongoing", "Completed", "Cancelled"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY event_date ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      error: "Failed to fetch events",
    });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      error: "Failed to fetch event",
    });
  }
});

router.post("/", async function (req, res) {
  const {
    organizer_id,
    venue_id,
    name,
    event_type,
    description,
    event_date,
    start_time,
    end_time,
    expected_attendees,
    dress_code,
    agenda,
    status,
  } = req.body;

  if (isMissing(organizer_id) || isMissing(name) || isMissing(event_date)) {
    return res.status(400).json({
      error: "organizer_id, name, and event_date are required",
    });
  }

  if (status && !allowedEventStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid event status",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (
        organizer_id, venue_id, name, event_type, description, event_date,
        start_time, end_time, expected_attendees, dress_code, agenda, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, 'Planned'))
      RETURNING *`,
      [
        organizer_id,
        venue_id || null,
        name,
        event_type || null,
        description || null,
        event_date,
        start_time || null,
        end_time || null,
        expected_attendees || null,
        dress_code || null,
        agenda || null,
        status || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      error: "Failed to create event",
    });
  }
});

router.put("/:id", async function (req, res) {
  const {
    organizer_id,
    venue_id,
    name,
    event_type,
    description,
    event_date,
    start_time,
    end_time,
    expected_attendees,
    dress_code,
    agenda,
    status,
  } = req.body;

  if (status && !allowedEventStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid event status",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE events
      SET
        organizer_id = COALESCE($1, organizer_id),
        venue_id = COALESCE($2, venue_id),
        name = COALESCE($3, name),
        event_type = COALESCE($4, event_type),
        description = COALESCE($5, description),
        event_date = COALESCE($6, event_date),
        start_time = COALESCE($7, start_time),
        end_time = COALESCE($8, end_time),
        expected_attendees = COALESCE($9, expected_attendees),
        dress_code = COALESCE($10, dress_code),
        agenda = COALESCE($11, agenda),
        status = COALESCE($12, status)
      WHERE id = $13
      RETURNING *`,
      [
        organizer_id || null,
        venue_id || null,
        name || null,
        event_type || null,
        description || null,
        event_date || null,
        start_time || null,
        end_time || null,
        expected_attendees || null,
        dress_code || null,
        agenda || null,
        status || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      error: "Failed to update event",
    });
  }
});

module.exports = router;
