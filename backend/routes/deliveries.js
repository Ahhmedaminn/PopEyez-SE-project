const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedStatuses = ["Preparing", "Out for Delivery", "Delivered", "Delayed", "Arrived"];

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM deliveries ORDER BY scheduled_arrival ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    res.status(500).json({ error: "Failed to fetch deliveries" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM deliveries WHERE event_id = $1 ORDER BY scheduled_arrival ASC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event deliveries:", error);
    res.status(500).json({ error: "Failed to fetch event deliveries" });
  }
});

router.get("/vendor/:vendorId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM deliveries WHERE vendor_id = $1 ORDER BY scheduled_arrival ASC", [
      req.params.vendorId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor deliveries:", error);
    res.status(500).json({ error: "Failed to fetch vendor deliveries" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid delivery status" });
  }

  try {
    const result = await pool.query(
      `UPDATE deliveries
      SET status = $1,
          arrived_at = CASE WHEN $1 = 'Arrived' THEN CURRENT_TIMESTAMP ELSE arrived_at END
      WHERE id = $2
      RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ error: "Failed to update delivery status" });
  }
});

module.exports = router;
