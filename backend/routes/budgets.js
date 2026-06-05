const express = require("express");
const pool = require("../db");

const router = express.Router();

function isMissing(value) {
  return value === undefined || value === null || value === "";
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
  const { event_id, category, planned_amount, notes } = req.body;

  if (isMissing(event_id) || isMissing(category) || isMissing(planned_amount)) {
    return res.status(400).json({
      error: "event_id, category, and planned_amount are required",
    });
  }

  try {
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
  const { event_id, category, planned_amount, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE budgets
      SET
        event_id = COALESCE($1, event_id),
        category = COALESCE($2, category),
        planned_amount = COALESCE($3, planned_amount),
        notes = COALESCE($4, notes)
      WHERE id = $5
      RETURNING *`,
      [
        event_id || null,
        category || null,
        planned_amount === undefined ? null : planned_amount,
        notes || null,
        req.params.id,
      ]
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
