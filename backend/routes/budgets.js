const express = require("express");
const pool = require("../db");
const { organizerOwnsEvent } = require("../ownership");

const router = express.Router();

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

function isInvalidAmount(value) {
  return isMissing(value) || !Number.isFinite(Number(value)) || Number(value) <= 0;
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM budgets ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({
      error: "Failed to fetch budgets",
    });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    if (!(await organizerOwnsEvent(pool, req.params.eventId, req.query.organizer_id))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const result = await pool.query("SELECT * FROM budgets WHERE event_id = $1 ORDER BY id ASC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event budgets:", error);
    res.status(500).json({
      error: "Failed to fetch event budgets",
    });
  }
});

router.post("/", async function (req, res) {
  const { event_id, category, planned_amount, notes, organizer_id } = req.body;

  if (isMissing(event_id) || isMissing(category) || isInvalidAmount(planned_amount)) {
    return res.status(400).json({
      error: "event_id and category are required, and planned_amount must be greater than zero",
    });
  }

  try {
    if (!(await organizerOwnsEvent(pool, event_id, organizer_id))) {
      return res.status(403).json({ error: "You can only budget for your own events" });
    }

    const result = await pool.query(
      `INSERT INTO budgets (event_id, category, planned_amount, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [event_id, category, planned_amount, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({
      error: "Failed to create budget",
    });
  }
});

router.put("/:id", async function (req, res) {
  const { event_id, category, planned_amount, notes, organizer_id } = req.body;

  if (isMissing(event_id) || isMissing(category) || isInvalidAmount(planned_amount)) {
    return res.status(400).json({
      error: "event_id and category are required, and planned_amount must be greater than zero",
    });
  }

  try {
    if (!(await organizerOwnsEvent(pool, event_id, organizer_id))) {
      return res.status(403).json({ error: "You can only edit budgets for your own events" });
    }

    const result = await pool.query(
      `UPDATE budgets
      SET
        event_id = $1,
        category = $2,
        planned_amount = $3,
        notes = $4
      WHERE id = $5
        AND event_id = $1
      RETURNING *`,
      [event_id, category, planned_amount, notes || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating budget:", error);
    res.status(500).json({
      error: "Failed to update budget",
    });
  }
});

module.exports = router;
