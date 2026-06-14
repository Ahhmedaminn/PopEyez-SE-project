const express = require("express");
const pool = require("../db");
const { organizerOwnsEvent } = require("../ownership");

const router = express.Router();

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM feedback ORDER BY submitted_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      error: "Failed to fetch feedback",
    });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    if (!(await organizerOwnsEvent(pool, req.params.eventId, req.query.organizer_id))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const result = await pool.query(
      `SELECT feedback.*, guests.full_name AS guest_name
      FROM feedback
      LEFT JOIN guests ON guests.id = feedback.guest_id
      WHERE feedback.event_id = $1
      ORDER BY COALESCE(feedback.submitted_at, feedback.created_at) DESC`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event feedback:", error);
    res.status(500).json({
      error: "Failed to fetch event feedback",
    });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM feedback WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Feedback not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching feedback record:", error);
    res.status(500).json({
      error: "Failed to fetch feedback record",
    });
  }
});

module.exports = router;
