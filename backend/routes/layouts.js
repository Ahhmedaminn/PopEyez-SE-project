const express = require("express");
const pool = require("../db");

const router = express.Router();

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

function prepareLayoutData(layoutData) {
  if (layoutData === undefined || layoutData === null || layoutData === "") {
    return null;
  }

  if (typeof layoutData === "string") {
    return layoutData;
  }

  return JSON.stringify(layoutData);
}

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM layouts ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching layouts:", error);
    res.status(500).json({ error: "Failed to fetch layouts" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM layouts WHERE event_id = $1 ORDER BY id ASC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event layouts:", error);
    res.status(500).json({ error: "Failed to fetch event layouts" });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM layouts WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Layout not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching layout:", error);
    res.status(500).json({ error: "Failed to fetch layout" });
  }
});

router.post("/", async function (req, res) {
  const { event_id, venue_id, created_by, name, layout_data, shared_with_team, export_url } = req.body;

  if (isMissing(event_id) || isMissing(name)) {
    return res.status(400).json({ error: "event_id and name are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO layouts (event_id, venue_id, created_by, name, layout_data, shared_with_team, export_url)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, FALSE), $7)
      RETURNING *`,
      [
        event_id,
        venue_id || null,
        created_by || null,
        name,
        prepareLayoutData(layout_data),
        shared_with_team,
        export_url || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating layout:", error);
    res.status(500).json({ error: "Failed to create layout" });
  }
});

router.put("/:id", async function (req, res) {
  const { event_id, venue_id, created_by, name, layout_data, shared_with_team, export_url } = req.body;
  const sharedValue = shared_with_team === undefined ? null : shared_with_team;

  try {
    const result = await pool.query(
      `UPDATE layouts
      SET
        event_id = COALESCE($1, event_id),
        venue_id = COALESCE($2, venue_id),
        created_by = COALESCE($3, created_by),
        name = COALESCE($4, name),
        layout_data = COALESCE($5, layout_data),
        shared_with_team = COALESCE($6, shared_with_team),
        export_url = COALESCE($7, export_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [
        event_id || null,
        venue_id || null,
        created_by || null,
        name || null,
        prepareLayoutData(layout_data),
        sharedValue,
        export_url || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Layout not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating layout:", error);
    res.status(500).json({ error: "Failed to update layout" });
  }
});

router.patch("/:id/share", async function (req, res) {
  const { shared_with_team } = req.body;

  if (typeof shared_with_team !== "boolean") {
    return res.status(400).json({ error: "shared_with_team must be true or false" });
  }

  try {
    const result = await pool.query(
      "UPDATE layouts SET shared_with_team = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [shared_with_team, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Layout not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error sharing layout:", error);
    res.status(500).json({ error: "Failed to update layout sharing" });
  }
});

module.exports = router;
