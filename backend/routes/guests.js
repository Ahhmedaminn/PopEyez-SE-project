const express = require("express");
const pool = require("../db");
const { organizerOwnsEvent } = require("../ownership");

const router = express.Router();
const allowedRsvpStatuses = ["Attending", "Not Attending", "Maybe", "No Response"];
const defaultGuestPassword = "demo_hash_guest";

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const { organizer_id } = req.query;
    if (!/^\d+$/.test(String(organizer_id || ""))) {
      return res.status(400).json({ error: "organizer_id is required" });
    }

    const result = await pool.query(
      `SELECT guests.*, events.name AS event_name
      FROM guests
      JOIN events ON events.id = guests.event_id
      WHERE events.organizer_id = $1
      ORDER BY guests.full_name ASC`,
      [organizer_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({ error: "Failed to fetch guests" });
  }
});

router.get("/search", async function (req, res) {
  const { name, email, dietary_preference, event_id, rsvp_status, organizer_id } = req.query;
  const filters = [];
  const values = [];

  if (!/^\d+$/.test(String(organizer_id || ""))) {
    return res.status(400).json({ error: "organizer_id is required" });
  }

  values.push(organizer_id);
  filters.push(`events.organizer_id = $${values.length}`);

  if (name) {
    values.push(`%${name}%`);
    filters.push(`guests.full_name ILIKE $${values.length}`);
  }

  if (email) {
    values.push(`%${email}%`);
    filters.push(`guests.email ILIKE $${values.length}`);
  }

  if (dietary_preference) {
    values.push(`%${dietary_preference}%`);
    filters.push(`COALESCE(rsvps.dietary_preferences, guests.dietary_preferences, '') ILIKE $${values.length}`);
  }

  if (event_id) {
    values.push(event_id);
    filters.push(`guests.event_id = $${values.length}`);
  }

  if (rsvp_status) {
    if (!allowedRsvpStatuses.includes(rsvp_status)) {
      return res.status(400).json({ error: "Invalid RSVP status" });
    }

    values.push(rsvp_status);
    filters.push(`COALESCE(rsvps.status, 'No Response') = $${values.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT
        guests.*,
        events.name AS event_name,
        COALESCE(rsvps.status, 'No Response') AS rsvp_status,
        invitations.id AS invitation_id,
        invitations.status AS invitation_status,
        invitations.channel AS invitation_channel,
        invitations.sent_at
      FROM guests
      JOIN events ON events.id = guests.event_id
      LEFT JOIN rsvps
        ON rsvps.event_id = guests.event_id
        AND rsvps.guest_id = guests.id
      LEFT JOIN invitations
        ON invitations.event_id = guests.event_id
        AND invitations.guest_id = guests.id
      WHERE ${filters.join(" AND ")}
      ORDER BY guests.full_name ASC`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error searching guests:", error);
    res.status(500).json({ error: "Failed to search guests" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    if (!(await organizerOwnsEvent(pool, req.params.eventId, req.query.organizer_id))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const result = await pool.query("SELECT * FROM guests WHERE event_id = $1 ORDER BY id ASC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event guests:", error);
    res.status(500).json({ error: "Failed to fetch event guests" });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT guests.*, events.name AS event_name
      FROM guests
      JOIN events ON events.id = guests.event_id
      WHERE guests.id = $1 AND events.organizer_id = $2`,
      [req.params.id, req.query.organizer_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching guest:", error);
    res.status(500).json({ error: "Failed to fetch guest" });
  }
});

router.post("/", async function (req, res) {
  const {
    event_id,
    user_id,
    full_name,
    email,
    phone,
    dietary_preferences,
    special_requirements,
    notes,
    organizer_id,
  } = req.body;

  if (isMissing(event_id) || isMissing(full_name)) {
    return res.status(400).json({ error: "event_id and full_name are required" });
  }

  if (!String(full_name).trim()) {
    return res.status(400).json({ error: "full_name cannot be empty" });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid guest email" });
  }

  try {
    if (!(await organizerOwnsEvent(pool, event_id, organizer_id))) {
      return res.status(403).json({ error: "You can only add guests to your own events" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const trimmedEmail = email ? String(email).trim() : null;
      const trimmedFullName = String(full_name).trim();
      let linkedUserId = user_id || null;
      let accountCreated = false;

      if (!linkedUserId && trimmedEmail) {
        const userResult = await client.query(
          "SELECT id, role, status FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
          [trimmedEmail]
        );
        const existingUser = userResult.rows[0];

        if (existingUser) {
          if (existingUser.role !== "guest" || existingUser.status !== "Active") {
            await client.query("ROLLBACK");
            return res.status(400).json({
              error: "This email already belongs to a non-active guest account",
            });
          }

          linkedUserId = existingUser.id;
        } else {
          const createdUserResult = await client.query(
            `INSERT INTO users (
              full_name, email, password_hash, role, status, phone, created_by
            )
            VALUES ($1, $2, $3, 'guest', 'Active', $4, $5)
            RETURNING id`,
            [
              trimmedFullName,
              trimmedEmail,
              defaultGuestPassword,
              phone ? String(phone).trim() : null,
              organizer_id,
            ]
          );
          linkedUserId = createdUserResult.rows[0].id;
          accountCreated = true;
        }
      }

      const result = await client.query(
        `INSERT INTO guests (
          event_id, user_id, full_name, email, phone, dietary_preferences, special_requirements, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          event_id,
          linkedUserId,
          trimmedFullName,
          trimmedEmail,
          phone ? String(phone).trim() : null,
          dietary_preferences ? String(dietary_preferences).trim() : null,
          special_requirements ? String(special_requirements).trim() : null,
          notes ? String(notes).trim() : null,
        ]
      );

      await client.query("COMMIT");
      res.status(201).json({
        ...result.rows[0],
        account_created: accountCreated,
        login_email: trimmedEmail,
        temporary_password: accountCreated ? defaultGuestPassword : null,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating guest:", error);
    res.status(500).json({ error: "Failed to create guest" });
  }
});

router.put("/:id", async function (req, res) {
  const {
    event_id,
    user_id,
    full_name,
    email,
    phone,
    dietary_preferences,
    special_requirements,
    notes,
    organizer_id,
  } = req.body;

  try {
    const currentGuestResult = await pool.query(
      `SELECT guests.event_id
      FROM guests
      JOIN events ON events.id = guests.event_id
      WHERE guests.id = $1 AND events.organizer_id = $2`,
      [req.params.id, organizer_id]
    );

    if (currentGuestResult.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    const targetEventId = event_id || currentGuestResult.rows[0].event_id;
    if (!(await organizerOwnsEvent(pool, targetEventId, organizer_id))) {
      return res.status(403).json({ error: "You can only edit guests for your own events" });
    }

    const result = await pool.query(
      `UPDATE guests
      SET
        event_id = COALESCE($1, event_id),
        user_id = COALESCE($2, user_id),
        full_name = COALESCE($3, full_name),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        dietary_preferences = COALESCE($6, dietary_preferences),
        special_requirements = COALESCE($7, special_requirements),
        notes = COALESCE($8, notes)
      WHERE id = $9
      RETURNING *`,
      [
        event_id || null,
        user_id || null,
        full_name || null,
        email || null,
        phone || null,
        dietary_preferences || null,
        special_requirements || null,
        notes || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Guest not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating guest:", error);
    res.status(500).json({ error: "Failed to update guest" });
  }
});

module.exports = router;
