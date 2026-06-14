const express = require("express");
const pool = require("../db");
const { organizerOwnsEvent, requireEventAccess } = require("../ownership");

const router = express.Router();
const allowedStatuses = ["Sent", "Received", "Seen"];
const allowedMessageTypes = ["day-of", "clarification", "notification", "follow-up"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

function validateOrganizerMessage(body) {
  if (isMissing(body.event_id) || isMissing(body.sender_id) || isMissing(body.body)) {
    return "event_id, sender_id, and body are required";
  }

  if (!String(body.body).trim()) {
    return "Message body cannot be empty";
  }

  return null;
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

router.get("/operations/:eventId", async function (req, res) {
  const { eventId } = req.params;
  const { organizer_id } = req.query;

  try {
    if (!(await organizerOwnsEvent(pool, eventId, organizer_id))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const guestResult = await pool.query(
      `SELECT
        guests.id,
        guests.full_name,
        guests.email,
        guests.phone,
        COALESCE(rsvps.status, 'No Response') AS rsvp_status,
        COALESCE(checkins.status, 'Not Arrived') AS checkin_status,
        latest_message.id AS latest_message_id,
        latest_message.status AS message_status,
        latest_message.subject AS message_subject,
        latest_message.message_type,
        latest_message.created_at AS message_created_at
      FROM guests
      LEFT JOIN rsvps
        ON rsvps.event_id = guests.event_id
        AND rsvps.guest_id = guests.id
      LEFT JOIN checkins
        ON checkins.event_id = guests.event_id
        AND checkins.guest_id = guests.id
      LEFT JOIN LATERAL (
        SELECT messages.*
        FROM messages
        WHERE messages.event_id = guests.event_id
          AND messages.guest_id = guests.id
          AND messages.message_type IN ('day-of', 'follow-up')
        ORDER BY messages.created_at DESC, messages.id DESC
        LIMIT 1
      ) AS latest_message ON TRUE
      WHERE guests.event_id = $1
      ORDER BY guests.full_name ASC`,
      [eventId]
    );

    const messageResult = await pool.query(
      `SELECT
        messages.*,
        guests.full_name AS guest_name
      FROM messages
      LEFT JOIN guests ON guests.id = messages.guest_id
      WHERE messages.event_id = $1
        AND messages.message_type IN ('day-of', 'follow-up')
      ORDER BY messages.created_at DESC, messages.id DESC`,
      [eventId]
    );

    const guests = guestResult.rows;
    const messages = messageResult.rows;
    res.json({
      summary: {
        total_guests: guests.length,
        arrived_guests: guests.filter((guest) => guest.checkin_status === "Arrived").length,
        not_arrived_guests: guests.filter((guest) => guest.checkin_status !== "Arrived").length,
        sent_messages: messages.filter((message) => message.status === "Sent").length,
        received_messages: messages.filter((message) => message.status === "Received").length,
        seen_messages: messages.filter((message) => message.status === "Seen").length,
        unseen_messages: messages.filter((message) => message.status !== "Seen").length,
      },
      guests,
      messages,
    });
  } catch (error) {
    console.error("Error fetching day-of operations:", error);
    res.status(500).json({ error: "Failed to fetch day-of operations" });
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

    const result = await pool.query(
      `SELECT messages.*, guests.full_name AS guest_name
      FROM messages
      LEFT JOIN guests ON guests.id = messages.guest_id
      WHERE messages.event_id = $1
      ORDER BY messages.created_at DESC`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event messages:", error);
    res.status(500).json({ error: "Failed to fetch event messages" });
  }
});

router.post("/broadcast", async function (req, res) {
  const validationError = validateOrganizerMessage(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { event_id, sender_id, subject, body } = req.body;

  try {
    if (!(await organizerOwnsEvent(pool, event_id, sender_id))) {
      return res.status(403).json({ error: "You can only message guests for your own events" });
    }

    const result = await pool.query(
      `INSERT INTO messages (
        event_id, sender_id, recipient_user_id, guest_id, subject, body, message_type, status
      )
      SELECT
        guests.event_id, $2, guests.user_id, guests.id, $3, $4, 'day-of', 'Sent'
      FROM guests
      WHERE guests.event_id = $1
      RETURNING *`,
      [event_id, sender_id, subject ? String(subject).trim() : null, String(body).trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "This event has no guests to message" });
    }

    res.status(201).json({
      message: `Day-of message sent to ${result.rows.length} guest(s)`,
      sent_count: result.rows.length,
    });
  } catch (error) {
    console.error("Error broadcasting day-of message:", error);
    res.status(500).json({ error: "Failed to send day-of message" });
  }
});

router.post("/follow-up", async function (req, res) {
  const validationError = validateOrganizerMessage(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { event_id, sender_id, subject, body } = req.body;

  try {
    if (!(await organizerOwnsEvent(pool, event_id, sender_id))) {
      return res.status(403).json({ error: "You can only message guests for your own events" });
    }

    const result = await pool.query(
      `INSERT INTO messages (
        event_id, sender_id, recipient_user_id, guest_id, subject, body, message_type, status
      )
      SELECT
        guests.event_id, $2, guests.user_id, guests.id, $3, $4, 'follow-up', 'Sent'
      FROM guests
      WHERE guests.event_id = $1
        AND EXISTS (
          SELECT 1
          FROM messages initial_message
          WHERE initial_message.event_id = guests.event_id
            AND initial_message.guest_id = guests.id
            AND initial_message.message_type = 'day-of'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM messages seen_message
          WHERE seen_message.event_id = guests.event_id
            AND seen_message.guest_id = guests.id
            AND seen_message.message_type = 'day-of'
            AND seen_message.status = 'Seen'
        )
      RETURNING *`,
      [event_id, sender_id, subject ? String(subject).trim() : null, String(body).trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "There are no unseen initial day-of messages to follow up",
      });
    }

    res.status(201).json({
      message: `Follow-up sent to ${result.rows.length} unseen guest(s)`,
      sent_count: result.rows.length,
    });
  } catch (error) {
    console.error("Error sending follow-up message:", error);
    res.status(500).json({ error: "Failed to send follow-up message" });
  }
});

router.post("/", async function (req, res) {
  const { event_id, sender_id, recipient_user_id, guest_id, subject, body, message_type, status } = req.body;

  if (isMissing(event_id) || isMissing(body)) {
    return res.status(400).json({ error: "event_id and body are required" });
  }

  if (!String(body).trim()) {
    return res.status(400).json({ error: "Message body cannot be empty" });
  }

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid message status" });
  }

  if (message_type && !allowedMessageTypes.includes(message_type)) {
    return res.status(400).json({ error: "Invalid message_type" });
  }

  try {
    if (!sender_id || !(await organizerOwnsEvent(pool, event_id, sender_id))) {
      return res.status(403).json({ error: "You can only message guests for your own events" });
    }

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
        String(body).trim(),
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
