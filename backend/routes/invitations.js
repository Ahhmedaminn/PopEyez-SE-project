const express = require("express");
const pool = require("../db");
const { sendInvitationEmail } = require("../emailService");
const { organizerOwnsEvent } = require("../ownership");

const router = express.Router();
const allowedStatuses = ["Draft", "Sent", "Opened", "Cancelled"];
const allowedChannels = ["email", "platform"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM invitations ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    if (!(await organizerOwnsEvent(pool, req.params.eventId, req.query.organizer_id))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const result = await pool.query("SELECT * FROM invitations WHERE event_id = $1 ORDER BY created_at DESC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event invitations:", error);
    res.status(500).json({ error: "Failed to fetch event invitations" });
  }
});

router.post("/", async function (req, res) {
  const { event_id, guest_id, sent_by, invitation_code, channel, status, sent_at } = req.body;

  if (isMissing(event_id) || isMissing(guest_id)) {
    return res.status(400).json({ error: "event_id and guest_id are required" });
  }

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid invitation status" });
  }

  if (channel && !allowedChannels.includes(channel)) {
    return res.status(400).json({ error: "Invalid invitation channel" });
  }

  try {
    if (!sent_by || !(await organizerOwnsEvent(pool, event_id, sent_by))) {
      return res.status(403).json({ error: "You can only invite guests to your own events" });
    }

    const selectedChannel = channel || "email";

    const guestResult = await pool.query(
      "SELECT full_name, email FROM guests WHERE id = $1 AND event_id = $2",
      [guest_id, event_id]
    );
    if (guestResult.rows.length === 0) {
      return res.status(400).json({ error: "Guest does not belong to the selected event" });
    }

    if (selectedChannel === "email" && !guestResult.rows[0].email) {
      return res.status(400).json({ error: "This guest needs an email address for an email invitation" });
    }

    const duplicateResult = await pool.query(
      "SELECT id FROM invitations WHERE event_id = $1 AND guest_id = $2",
      [event_id, guest_id]
    );
    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({
        error: "An invitation already exists for this guest and event",
      });
    }

    const client = await pool.connect();
    let createdInvitation;
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO invitations (event_id, guest_id, sent_by, invitation_code, channel, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Draft'), $7)
        RETURNING *`,
        [
          event_id,
          guest_id,
          sent_by,
          invitation_code || null,
          selectedChannel,
          status || null,
          sent_at || null,
        ]
      );
      createdInvitation = result.rows[0];

      await client.query(
        `INSERT INTO rsvps (
          invitation_id, event_id, guest_id, status, dietary_preferences, special_requirements
        )
        SELECT $1, guests.event_id, guests.id, 'No Response',
          guests.dietary_preferences, guests.special_requirements
        FROM guests
        WHERE guests.id = $2`,
        [result.rows[0].id, guest_id]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    let emailDelivery = null;
    const shouldSendEmail = selectedChannel === "email" && (status || "Draft") !== "Draft";
    if (shouldSendEmail) {
      try {
        const emailResult = await pool.query(
          `SELECT
            invitations.id AS invitation_id,
            invitations.invitation_code,
            guests.full_name AS guest_name,
            guests.email AS guest_email,
            events.name AS event_name,
            TO_CHAR(events.event_date, 'YYYY-MM-DD') AS event_date,
            events.start_time,
            events.dress_code,
            events.agenda,
            venues.name AS venue_name,
            venues.city AS venue_city,
            users.full_name AS organizer_name
          FROM invitations
          JOIN guests ON guests.id = invitations.guest_id
          JOIN events ON events.id = invitations.event_id
          LEFT JOIN venues ON venues.id = events.venue_id
          LEFT JOIN users ON users.id = invitations.sent_by
          WHERE invitations.id = $1`,
          [createdInvitation.id]
        );
        emailDelivery = await sendInvitationEmail(emailResult.rows[0]);
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        emailDelivery = {
          status: "failed",
          reason: emailError.message || "Email delivery failed",
        };
      }
    }

    res.status(201).json({
      ...createdInvitation,
      email_delivery: emailDelivery,
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ error: "Failed to create invitation" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status, organizer_id } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid invitation status" });
  }

  try {
    const result = await pool.query(
      `UPDATE invitations
      SET
        status = $1,
        sent_at = CASE
          WHEN $1 = 'Sent' AND sent_at IS NULL THEN CURRENT_TIMESTAMP
          ELSE sent_at
        END
      WHERE id = $2
        AND EXISTS (
          SELECT 1 FROM events
          WHERE events.id = invitations.event_id
            AND events.organizer_id = $3
        )
      RETURNING *`,
      [status, req.params.id, organizer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    let emailDelivery = null;
    if (status === "Sent" && result.rows[0].channel === "email") {
      try {
        const emailResult = await pool.query(
          `SELECT
            invitations.id AS invitation_id,
            invitations.invitation_code,
            guests.full_name AS guest_name,
            guests.email AS guest_email,
            events.name AS event_name,
            TO_CHAR(events.event_date, 'YYYY-MM-DD') AS event_date,
            events.start_time,
            events.dress_code,
            events.agenda,
            venues.name AS venue_name,
            venues.city AS venue_city,
            users.full_name AS organizer_name
          FROM invitations
          JOIN guests ON guests.id = invitations.guest_id
          JOIN events ON events.id = invitations.event_id
          LEFT JOIN venues ON venues.id = events.venue_id
          LEFT JOIN users ON users.id = invitations.sent_by
          WHERE invitations.id = $1`,
          [result.rows[0].id]
        );
        emailDelivery = await sendInvitationEmail(emailResult.rows[0]);
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        emailDelivery = {
          status: "failed",
          reason: emailError.message || "Email delivery failed",
        };
      }
    }

    res.json({
      ...result.rows[0],
      email_delivery: emailDelivery,
    });
  } catch (error) {
    console.error("Error updating invitation status:", error);
    res.status(500).json({ error: "Failed to update invitation status" });
  }
});

module.exports = router;
