const express = require("express");
const pool = require("../db");
const { requireEventAccess } = require("../ownership");

const router = express.Router();
const allowedStatuses = ["Not Arrived", "Arrived"];
const allowedMethods = ["qr_code", "name_confirmation"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM checkins ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    res.status(500).json({ error: "Failed to fetch check-ins" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    if (!(await requireEventAccess(
      pool,
      req.params.eventId,
      req.query.organizer_id,
      req.query.staff_id
    ))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const result = await pool.query("SELECT * FROM checkins WHERE event_id = $1 ORDER BY id ASC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event check-ins:", error);
    res.status(500).json({ error: "Failed to fetch event check-ins" });
  }
});

router.post("/", async function (req, res) {
  const { event_id, guest_id, checked_in_by, status, checkin_method, checked_in_at } = req.body;

  if (isMissing(event_id) || isMissing(guest_id)) {
    return res.status(400).json({ error: "event_id and guest_id are required" });
  }

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid check-in status" });
  }

  if (checkin_method && !allowedMethods.includes(checkin_method)) {
    return res.status(400).json({ error: "Invalid checkin_method" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO checkins (
        event_id, guest_id, checked_in_by, status, checkin_method, checked_in_at
      )
      VALUES (
        $1, $2, $3, COALESCE($4, 'Not Arrived'), $5,
        CASE WHEN $4 = 'Arrived' AND $6 IS NULL THEN CURRENT_TIMESTAMP ELSE $6 END
      )
      RETURNING *`,
      [
        event_id,
        guest_id,
        checked_in_by || null,
        status || null,
        checkin_method || null,
        checked_in_at || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating check-in:", error);
    res.status(500).json({ error: "Failed to create check-in" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status, checked_in_at, organizer_id, staff_id } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid check-in status" });
  }

  try {
    if (!organizer_id && !staff_id) {
      return res.status(400).json({ error: "organizer_id or staff_id is required" });
    }

    const accessClause = staff_id
      ? `EXISTS (
          SELECT 1 FROM tasks
          WHERE tasks.event_id = checkins.event_id
            AND tasks.assigned_to = $4
            AND tasks.status <> 'Not Assigned'
        )`
      : `EXISTS (
          SELECT 1 FROM events
          WHERE events.id = checkins.event_id
            AND events.organizer_id = $4
        )`;
    const result = await pool.query(
      `UPDATE checkins
      SET status = $1::varchar,
          checked_in_at = CASE
            WHEN $1::varchar = 'Arrived' AND $3::timestamp IS NULL THEN CURRENT_TIMESTAMP
            WHEN $1::varchar = 'Arrived' THEN $3::timestamp
            ELSE checked_in_at
          END
      WHERE id = $2
        AND ${accessClause}
      RETURNING *`,
      [status, req.params.id, checked_in_at || null, staff_id || organizer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Check-in not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating check-in status:", error);
    res.status(500).json({ error: "Failed to update check-in status" });
  }
});

module.exports = router;
