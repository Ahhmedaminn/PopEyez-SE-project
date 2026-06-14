const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedTaskStatuses = ["Not Assigned", "Pending", "In Progress", "Done", "Overdue"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  const { status, event_id, assigned_to } = req.query;
  const filters = [];
  const values = [];

  if (status) {
    if (!allowedTaskStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid task status",
      });
    }

    values.push(status);
    filters.push(`status = $${values.length}`);
  }

  if (event_id) {
    values.push(event_id);
    filters.push(`event_id = $${values.length}`);
  }

  if (assigned_to) {
    values.push(assigned_to);
    filters.push(`assigned_to = $${values.length}`);
  }

  try {
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(`SELECT * FROM tasks ${whereClause} ORDER BY due_date ASC`, values);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      error: "Failed to fetch tasks",
    });
  }
});

router.get("/staff/:staffId", async function (req, res) {
  const { status } = req.query;

  if (status && !allowedTaskStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid task status",
    });
  }

  try {
    const values = [req.params.staffId];
    const filters = ["tasks.assigned_to = $1"];

    if (status) {
      values.push(status);
      filters.push(`tasks.status = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT
        tasks.*,
        events.name AS event_name,
        events.event_type,
        events.description AS event_description,
        events.event_date,
        events.start_time,
        events.end_time,
        events.expected_attendees,
        events.dress_code,
        events.agenda,
        events.status AS event_status
      FROM tasks
      JOIN events ON events.id = tasks.event_id
      WHERE ${filters.join(" AND ")}
      ORDER BY tasks.due_date ASC, events.event_date ASC`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching staff tasks:", error);
    res.status(500).json({
      error: "Failed to fetch staff tasks",
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
        status || null,
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
        status || null,
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
      status,
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
