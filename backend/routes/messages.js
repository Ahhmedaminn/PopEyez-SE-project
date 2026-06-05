const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedStatuses = ["Sent", "Received", "Seen"];
const allowedMessageTypes = ["day-of", "clarification", "notification", "follow-up"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM messages ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM messages WHERE event_id = $1 ORDER BY created_at DESC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event messages:", error);
    res.status(500).json({ error: "Failed to fetch event messages" });
  }
});

router.post("/", async function (req, res) {
  const { event_id, sender_id, recipient_user_id, guest_id, subject, body, message_type, status } = req.body;

  if (isMissing(event_id) || isMissing(body)) {
    return res.status(400).json({ error: "event_id and body are required" });
  }

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid message status" });
  }

  if (message_type && !allowedMessageTypes.includes(message_type)) {
    return res.status(400).json({ error: "Invalid message_type" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (
        event_id, sender_id, recipient_user_id, guest_id, subject, body, message_type, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'day-of'), COALESCE($8, 'Sent'))
      RETURNING *`,
      [
        event_id,
        sender_id || null,
        recipient_user_id || null,
        guest_id || null,
        subject || null,
        body,
        message_type || null,
        status || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Failed to create message" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid message status" });
  }

  try {
    const result = await pool.query(
      `UPDATE messages
      SET status = $1,
          seen_at = CASE WHEN $1 = 'Seen' THEN CURRENT_TIMESTAMP ELSE seen_at END
      WHERE id = $2
      RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({ error: "Failed to update message status" });
  }
});

router.patch("/:id/seen", async function (req, res) {
  try {
    const result = await pool.query(
      "UPDATE messages SET status = 'Seen', seen_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error marking message as seen:", error);
    res.status(500).json({ error: "Failed to mark message as seen" });
  }
});

module.exports = router;
