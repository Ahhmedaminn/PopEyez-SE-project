const express = require("express");
const pool = require("../db");
const { organizerOwnsEvent } = require("../ownership");

const router = express.Router();
const allowedTaskStatuses = ["Not Assigned", "Pending", "In Progress", "Done", "Overdue"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

async function markOverdueTasks() {
  await pool.query(
    `UPDATE tasks
    SET status = 'Overdue'
    WHERE due_date < CURRENT_DATE
      AND status NOT IN ('Done', 'Overdue')`
  );
}

async function isDueDateTodayOrPast(dueDate) {
  if (isMissing(dueDate)) {
    return false;
  }

  const result = await pool.query("SELECT $1::date <= CURRENT_DATE AS invalid_due_date", [dueDate]);
  return result.rows[0].invalid_due_date;
}

router.get("/", async function (req, res) {
  const { status, event_id, assigned_to, organizer_id } = req.query;
  const filters = [];
  const values = [];

  if (status) {
    if (!allowedTaskStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid task status",
      });
    }

    values.push(status);
    filters.push(`tasks.status = $${values.length}`);
  }

  if (event_id) {
    values.push(event_id);
    filters.push(`tasks.event_id = $${values.length}`);
  }

  if (assigned_to) {
    values.push(assigned_to);
    filters.push(`tasks.assigned_to = $${values.length}`);
  }

  if (organizer_id) {
    if (!/^\d+$/.test(organizer_id)) {
      return res.status(400).json({
        error: "Invalid organizer_id",
      });
    }

    values.push(organizer_id);
    filters.push(`events.organizer_id = $${values.length}`);
  }

  try {
    await markOverdueTasks();
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT tasks.*, events.name AS event_name
      FROM tasks
      JOIN events ON events.id = tasks.event_id
      ${whereClause}
      ORDER BY tasks.due_date ASC`,
      values
    );
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
    await markOverdueTasks();
    const values = [req.params.staffId];
    const filters = ["tasks.assigned_to = $1", "tasks.status <> 'Not Assigned'"];

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
    await markOverdueTasks();
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
    if (!created_by || !(await organizerOwnsEvent(pool, event_id, created_by))) {
      return res.status(403).json({
        error: "You can only create tasks for your own events",
      });
    }

    if (assigned_to) {
      const staffResult = await pool.query(
        `SELECT 1 FROM users
        WHERE id = $1
          AND role = 'staff'
          AND status = 'Active'
          AND created_by = $2`,
        [assigned_to, created_by]
      );

      if (staffResult.rows.length === 0) {
        return res.status(400).json({
          error: "Tasks can only be assigned to your active staff members",
        });
      }
    }

    if (await isDueDateTodayOrPast(due_date)) {
      return res.status(400).json({
        error: "due_date must be after today",
      });
    }

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
    if (!created_by) {
      return res.status(400).json({
        error: "created_by is required",
      });
    }

    const existingTaskResult = await pool.query(
      `SELECT tasks.event_id
      FROM tasks
      JOIN events ON events.id = tasks.event_id
      WHERE tasks.id = $1 AND events.organizer_id = $2`,
      [req.params.id, created_by]
    );

    if (existingTaskResult.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    const targetEventId = event_id || existingTaskResult.rows[0].event_id;
    if (!(await organizerOwnsEvent(pool, targetEventId, created_by))) {
      return res.status(403).json({
        error: "You can only move tasks between your own events",
      });
    }

    if (assigned_to) {
      const staffResult = await pool.query(
        `SELECT 1 FROM users
        WHERE id = $1
          AND role = 'staff'
          AND status = 'Active'
          AND created_by = $2`,
        [assigned_to, created_by]
      );

      if (staffResult.rows.length === 0) {
        return res.status(400).json({
          error: "Tasks can only be assigned to your active staff members",
        });
      }
    }

    if (await isDueDateTodayOrPast(due_date)) {
      return res.status(400).json({
        error: "due_date must be after today",
      });
    }

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
        AND EXISTS (
          SELECT 1 FROM events
          WHERE events.id = tasks.event_id
            AND events.organizer_id = $3
        )
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
  const { status, organizer_id, staff_id } = req.body;

  if (!allowedTaskStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid task status",
    });
  }

  if (staff_id && !["Pending", "In Progress", "Done"].includes(status)) {
    return res.status(400).json({
      error: "Staff can only use Pending, In Progress, or Done",
    });
  }

  if (!organizer_id && !staff_id) {
    return res.status(400).json({
      error: "organizer_id or staff_id is required",
    });
  }

  try {
    const ownershipClause = staff_id
      ? "tasks.assigned_to = $3"
      : `EXISTS (
          SELECT 1 FROM events
          WHERE events.id = tasks.event_id
            AND events.organizer_id = $3
        )`;
    const actorId = staff_id || organizer_id;
    const result = await pool.query(
      `UPDATE tasks
      SET status = CASE
        WHEN due_date < CURRENT_DATE AND $1::varchar <> 'Done' THEN 'Overdue'
        ELSE $1::varchar
      END
      WHERE tasks.id = $2
        AND ${ownershipClause}
      RETURNING *`,
      [status, req.params.id, actorId]
    );

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
