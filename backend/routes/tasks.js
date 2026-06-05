const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedTaskStatuses = ["Not Assigned", "Pending", "In Progress", "Done", "Overdue"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

function normalizeTaskStatus(status) {
  if (status === "Overdue") {
    return "overdue";
  }

  return status;
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY due_date ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      error: "Failed to fetch tasks",
    });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({
      error: "Failed to fetch task",
    });
  }
});

router.post("/", async function (req, res) {
  const { event_id, assigned_to, created_by, title, description, category, due_date, status } = req.body;

  if (isMissing(event_id) || isMissing(title)) {
    return res.status(400).json({
      error: "event_id and title are required",
    });
  }

  if (status && !allowedTaskStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid task status",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (
        event_id, assigned_to, created_by, title, description, category, due_date, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'Pending'))
      RETURNING *`,
      [
        event_id,
        assigned_to || null,
        created_by || null,
        title,
        description || null,
        category || null,
        due_date || null,
        normalizeTaskStatus(status) || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      error: "Failed to create task",
    });
  }
});

router.put("/:id", async function (req, res) {
  const { event_id, assigned_to, created_by, title, description, category, due_date, status } = req.body;

  if (status && !allowedTaskStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid task status",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks
      SET
        event_id = COALESCE($1, event_id),
        assigned_to = COALESCE($2, assigned_to),
        created_by = COALESCE($3, created_by),
        title = COALESCE($4, title),
        description = COALESCE($5, description),
        category = COALESCE($6, category),
        due_date = COALESCE($7, due_date),
        status = COALESCE($8, status)
      WHERE id = $9
      RETURNING *`,
      [
        event_id || null,
        assigned_to || null,
        created_by || null,
        title || null,
        description || null,
        category || null,
        due_date || null,
        normalizeTaskStatus(status) || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      error: "Failed to update task",
    });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status } = req.body;

  if (!allowedTaskStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid task status",
    });
  }

  try {
    const result = await pool.query("UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *", [
      normalizeTaskStatus(status),
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      error: "Failed to update task status",
    });
  }
});

module.exports = router;
