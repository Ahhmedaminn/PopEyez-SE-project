const express = require("express");
const pool = require("../db");

const router = express.Router();

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM expenses ORDER BY spent_at ASC");
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
    const result = await pool.query("SELECT * FROM expenses WHERE event_id = $1 ORDER BY spent_at ASC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event expenses:", error);
    res.status(500).json({
      error: "Failed to fetch event expenses",
    });
  }
});

router.post("/", async function (req, res) {
  const { event_id, budget_id, vendor_id, title, category, amount, spent_at, payment_method, notes } = req.body;

  if (isMissing(event_id) || isMissing(title) || isMissing(amount)) {
    return res.status(400).json({
      error: "event_id, title, and amount are required",
    });
  }

  try {
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
  const { event_id, budget_id, vendor_id, title, category, amount, spent_at, payment_method, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE expenses
      SET
        event_id = COALESCE($1, event_id),
        budget_id = COALESCE($2, budget_id),
        vendor_id = COALESCE($3, vendor_id),
        title = COALESCE($4, title),
        category = COALESCE($5, category),
        amount = COALESCE($6, amount),
        spent_at = COALESCE($7, spent_at),
        payment_method = COALESCE($8, payment_method),
        notes = COALESCE($9, notes)
      WHERE id = $10
      RETURNING *`,
      [
        event_id || null,
        budget_id || null,
        vendor_id || null,
        title || null,
        category || null,
        amount === undefined ? null : amount,
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
