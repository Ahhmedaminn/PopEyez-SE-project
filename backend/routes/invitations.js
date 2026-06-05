const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedStatuses = ["Draft", "Sent", "Opened", "Cancelled"];
const allowedChannels = ["email", "sms", "platform"];

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
    const result = await pool.query(
      `INSERT INTO invitations (event_id, guest_id, sent_by, invitation_code, channel, status, sent_at)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Draft'), $7)
      RETURNING *`,
      [
        event_id,
        guest_id,
        sent_by || null,
        invitation_code || null,
        channel || null,
        status || null,
        sent_at || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ error: "Failed to create invitation" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid invitation status" });
  }

  try {
    const result = await pool.query("UPDATE invitations SET status = $1 WHERE id = $2 RETURNING *", [
      status,
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating invitation status:", error);
    res.status(500).json({ error: "Failed to update invitation status" });
  }
});

module.exports = router;
