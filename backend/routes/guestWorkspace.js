const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedRsvpStatuses = ["Attending", "Not Attending", "Maybe"];
const allowedMessageStatuses = ["Seen"];
const allowedSentiments = ["Positive", "Neutral", "Negative"];

function isValidId(value) {
  return /^\d+$/.test(String(value || ""));
}

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

async function isActiveGuest(userId) {
  if (!isValidId(userId)) {
    return false;
  }

  const result = await pool.query(
    "SELECT 1 FROM users WHERE id = $1 AND role = 'guest' AND status = 'Active'",
    [userId]
  );
  return result.rows.length > 0;
}

function normalizeOptionalText(value) {
  return isMissing(value) ? null : String(value).trim() || null;
}

function getSentimentFromRating(rating) {
  if (rating >= 4) return "Positive";
  if (rating <= 2) return "Negative";
  return "Neutral";
}

router.get("/:userId/invitations", async function (req, res) {
  const { userId } = req.params;

  try {
    if (!(await isActiveGuest(userId))) {
      return res.status(403).json({ error: "A valid active guest account is required" });
    }

    await pool.query(
      `UPDATE invitations
      SET status = 'Opened'
      FROM guests
      WHERE guests.id = invitations.guest_id
        AND guests.user_id = $1
        AND invitations.status = 'Sent'`,
      [userId]
    );

    const result = await pool.query(
      `SELECT
        invitations.id AS invitation_id,
        invitations.invitation_code,
        invitations.channel,
        invitations.status AS invitation_status,
        invitations.sent_at,
        invitations.created_at AS invitation_created_at,
        guests.id AS guest_id,
        guests.full_name AS guest_name,
        guests.email AS guest_email,
        guests.phone AS guest_phone,
        guests.dietary_preferences AS guest_dietary_preferences,
        guests.special_requirements AS guest_special_requirements,
        events.id AS event_id,
        events.name AS event_name,
        events.event_type,
        events.description AS event_description,
        events.event_date::text AS event_date,
        events.start_time::text AS start_time,
        events.end_time::text AS end_time,
        events.expected_attendees,
        events.dress_code,
        events.agenda,
        events.status AS event_status,
        venues.name AS venue_name,
        venues.location AS venue_location,
        venues.city AS venue_city,
        users.full_name AS organizer_name,
        users.email AS organizer_email,
        rsvps.id AS rsvp_id,
        COALESCE(rsvps.status, 'No Response') AS rsvp_status,
        COALESCE(rsvps.dietary_preferences, guests.dietary_preferences) AS dietary_preferences,
        COALESCE(rsvps.special_requirements, guests.special_requirements) AS special_requirements,
        rsvps.responded_at,
        COALESCE(checkins.status, 'Not Arrived') AS checkin_status,
        checkins.checked_in_at,
        checkins.checkin_method,
        feedback.id AS feedback_id,
        feedback.overall_rating,
        feedback.food_rating,
        feedback.venue_rating,
        feedback.organization_rating,
        feedback.sentiment,
        feedback.comments AS feedback_comments,
        feedback.submitted_at AS feedback_submitted_at,
        (
          SELECT COUNT(*)
          FROM messages
          WHERE messages.event_id = events.id
            AND messages.guest_id = guests.id
            AND messages.status <> 'Seen'
        ) AS unseen_messages_count
      FROM invitations
      JOIN guests ON guests.id = invitations.guest_id
      JOIN events ON events.id = invitations.event_id
      LEFT JOIN venues ON venues.id = events.venue_id
      LEFT JOIN users ON users.id = events.organizer_id
      LEFT JOIN rsvps ON rsvps.invitation_id = invitations.id
      LEFT JOIN checkins
        ON checkins.event_id = events.id
        AND checkins.guest_id = guests.id
      LEFT JOIN LATERAL (
        SELECT feedback.*
        FROM feedback
        WHERE feedback.event_id = events.id
          AND feedback.guest_id = guests.id
        ORDER BY COALESCE(feedback.submitted_at, feedback.created_at) DESC, feedback.id DESC
        LIMIT 1
      ) AS feedback ON TRUE
      WHERE guests.user_id = $1
      ORDER BY events.event_date ASC, events.start_time ASC NULLS LAST, invitations.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guest invitations:", error);
    res.status(500).json({ error: "Failed to fetch guest invitations" });
  }
});

router.patch("/rsvps/:id", async function (req, res) {
  const { id } = req.params;
  const { user_id, status, dietary_preferences, special_requirements } = req.body;

  if (!isValidId(user_id)) {
    return res.status(400).json({ error: "user_id is required" });
  }

  if (!allowedRsvpStatuses.includes(status)) {
    return res.status(400).json({ error: "Choose Attending, Not Attending, or Maybe before submitting" });
  }

  try {
    if (!(await isActiveGuest(user_id))) {
      return res.status(403).json({ error: "A valid active guest account is required" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const ownershipResult = await client.query(
        `SELECT
          rsvps.id,
          rsvps.event_id,
          rsvps.guest_id,
          invitations.status AS invitation_status,
          events.event_date
        FROM rsvps
        JOIN invitations ON invitations.id = rsvps.invitation_id
        JOIN guests ON guests.id = rsvps.guest_id
        JOIN events ON events.id = rsvps.event_id
        WHERE rsvps.id = $1
          AND guests.user_id = $2`,
        [id, user_id]
      );

      if (ownershipResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "RSVP not found for this guest" });
      }

      const ownedRsvp = ownershipResult.rows[0];

      if (ownedRsvp.invitation_status === "Cancelled") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Cancelled invitations cannot be RSVP'd to" });
      }

      const dateResult = await client.query(
        "SELECT $1::date >= CURRENT_DATE AS can_update",
        [ownedRsvp.event_date]
      );

      if (!dateResult.rows[0].can_update) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "RSVP changes are closed for past events" });
      }

      const normalizedDietary = isMissing(dietary_preferences)
        ? null
        : String(dietary_preferences).trim() || null;
      const normalizedRequirements = isMissing(special_requirements)
        ? null
        : String(special_requirements).trim() || null;

      const result = await client.query(
        `UPDATE rsvps
        SET
          status = $1,
          dietary_preferences = $2,
          special_requirements = $3,
          responded_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *`,
        [status, normalizedDietary, normalizedRequirements, id]
      );

      await client.query(
        `UPDATE guests
        SET dietary_preferences = $1,
            special_requirements = $2
        WHERE id = $3`,
        [normalizedDietary, normalizedRequirements, ownedRsvp.guest_id]
      );

      await client.query("COMMIT");
      res.json(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating guest RSVP:", error);
    res.status(500).json({ error: "Failed to update RSVP" });
  }
});

router.get("/:userId/messages", async function (req, res) {
  const { userId } = req.params;

  try {
    if (!(await isActiveGuest(userId))) {
      return res.status(403).json({ error: "A valid active guest account is required" });
    }

    await pool.query(
      `UPDATE messages
      SET status = 'Received'
      FROM guests
      WHERE guests.id = messages.guest_id
        AND guests.user_id = $1
        AND messages.status = 'Sent'`,
      [userId]
    );

    const result = await pool.query(
      `SELECT
        messages.*,
        events.name AS event_name,
        events.event_date::text AS event_date,
        guests.full_name AS guest_name
      FROM messages
      JOIN guests ON guests.id = messages.guest_id
      JOIN events ON events.id = messages.event_id
      WHERE guests.user_id = $1
      ORDER BY messages.created_at DESC, messages.id DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guest messages:", error);
    res.status(500).json({ error: "Failed to fetch guest messages" });
  }
});

router.patch("/messages/:id/status", async function (req, res) {
  const { id } = req.params;
  const { user_id, status } = req.body;

  if (!isValidId(user_id)) {
    return res.status(400).json({ error: "user_id is required" });
  }

  if (!allowedMessageStatuses.includes(status)) {
    return res.status(400).json({ error: "Guests can only mark messages as Seen" });
  }

  try {
    if (!(await isActiveGuest(user_id))) {
      return res.status(403).json({ error: "A valid active guest account is required" });
    }

    const result = await pool.query(
      `UPDATE messages
      SET status = 'Seen',
          seen_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND EXISTS (
          SELECT 1
          FROM guests
          WHERE guests.id = messages.guest_id
            AND guests.user_id = $2
        )
      RETURNING *`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found for this guest" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating guest message:", error);
    res.status(500).json({ error: "Failed to update message status" });
  }
});

router.post("/feedback", async function (req, res) {
  const {
    user_id,
    event_id,
    guest_id,
    overall_rating,
    food_rating,
    venue_rating,
    organization_rating,
    sentiment,
    comments,
  } = req.body;

  if (!isValidId(user_id)) {
    return res.status(400).json({ error: "user_id is required" });
  }

  if (!isValidId(event_id) || !isValidId(guest_id)) {
    return res.status(400).json({ error: "event_id and guest_id are required" });
  }

  const ratings = {
    overall_rating: Number(overall_rating),
    food_rating: Number(food_rating),
    venue_rating: Number(venue_rating),
    organization_rating: Number(organization_rating),
  };

  for (const [field, rating] of Object.entries(ratings)) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: `${field} must be a rating from 1 to 5` });
    }
  }

  const normalizedSentiment = sentiment || getSentimentFromRating(ratings.overall_rating);
  if (!allowedSentiments.includes(normalizedSentiment)) {
    return res.status(400).json({ error: "Invalid feedback sentiment" });
  }

  try {
    if (!(await isActiveGuest(user_id))) {
      return res.status(403).json({ error: "A valid active guest account is required" });
    }

    const ownershipResult = await pool.query(
      `SELECT 1
      FROM guests
      WHERE id = $1
        AND event_id = $2
        AND user_id = $3`,
      [guest_id, event_id, user_id]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: "Feedback event not found for this guest" });
    }

    const duplicateResult = await pool.query(
      "SELECT id FROM feedback WHERE event_id = $1 AND guest_id = $2 LIMIT 1",
      [event_id, guest_id]
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(409).json({ error: "Feedback already submitted for this event" });
    }

    const result = await pool.query(
      `INSERT INTO feedback (
        event_id,
        guest_id,
        overall_rating,
        food_rating,
        venue_rating,
        organization_rating,
        sentiment,
        comments,
        submitted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        event_id,
        guest_id,
        ratings.overall_rating,
        ratings.food_rating,
        ratings.venue_rating,
        ratings.organization_rating,
        normalizedSentiment,
        normalizeOptionalText(comments),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error submitting guest feedback:", error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

module.exports = router;
