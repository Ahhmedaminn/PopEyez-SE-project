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
    const result = await pool.query(
      "SELECT expenses.*, expenses.spent_at::text AS spent_at FROM expenses ORDER BY expenses.spent_at ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      error: "Failed to fetch expenses",
    });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    if (!(await organizerOwnsEvent(pool, req.params.eventId, req.query.organizer_id))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const result = await pool.query(
      `SELECT expenses.*, expenses.spent_at::text AS spent_at
      FROM expenses
      WHERE event_id = $1
      ORDER BY expenses.spent_at ASC`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event expenses:", error);
    res.status(500).json({
      error: "Failed to fetch event expenses",
    });
  }
});

router.post("/", async function (req, res) {
  const { event_id, budget_id, vendor_id, title, category, amount, spent_at, payment_method, notes, organizer_id } = req.body;

  if (isMissing(event_id) || isMissing(title) || isInvalidAmount(amount)) {
    return res.status(400).json({
      error: "event_id and title are required, and amount must be greater than zero",
    });
  }

  try {
    if (!(await organizerOwnsEvent(pool, event_id, organizer_id))) {
      return res.status(403).json({ error: "You can only add expenses to your own events" });
    }

    const result = await pool.query(
      `INSERT INTO expenses (
        event_id, budget_id, vendor_id, title, category, amount, spent_at, payment_method, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        event_id,
        budget_id || null,
        vendor_id || null,
        title,
        category || null,
        amount,
        spent_at || null,
        payment_method || null,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({
      error: "Failed to create expense",
    });
  }
});

router.put("/:id", async function (req, res) {
  const { event_id, budget_id, vendor_id, title, category, amount, spent_at, payment_method, notes, organizer_id } = req.body;

  if (isMissing(event_id) || isMissing(title) || isInvalidAmount(amount)) {
    return res.status(400).json({
      error: "event_id and title are required, and amount must be greater than zero",
    });
  }

  try {
    if (!(await organizerOwnsEvent(pool, event_id, organizer_id))) {
      return res.status(403).json({ error: "You can only edit expenses for your own events" });
    }

    const result = await pool.query(
      `UPDATE expenses
      SET
        event_id = $1,
        budget_id = $2,
        vendor_id = $3,
        title = $4,
        category = $5,
        amount = $6,
        spent_at = $7,
        payment_method = $8,
        notes = $9
      WHERE id = $10
        AND event_id = $1
      RETURNING *`,
      [
        event_id,
        budget_id || null,
        vendor_id || null,
        title,
        category || null,
        amount,
        spent_at || null,
        payment_method || null,
        notes || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Expense not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({
      error: "Failed to update expense",
    });
  }
});

module.exports = router;
