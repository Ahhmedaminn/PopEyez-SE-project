const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedStatuses = ["Pending Review", "Approved", "Paid", "Rejected"];

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM invoices ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM invoices WHERE event_id = $1 ORDER BY created_at DESC", [
      req.params.eventId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event invoices:", error);
    res.status(500).json({ error: "Failed to fetch event invoices" });
  }
});

router.get("/vendor/:vendorId", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM invoices WHERE vendor_id = $1 ORDER BY created_at DESC", [
      req.params.vendorId,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor invoices:", error);
    res.status(500).json({ error: "Failed to fetch vendor invoices" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid invoice status" });
  }

  try {
    const result = await pool.query(
      `UPDATE invoices
      SET status = $1,
          reviewed_at = CASE WHEN $1 IN ('Approved', 'Rejected') THEN CURRENT_TIMESTAMP ELSE reviewed_at END
      WHERE id = $2
      RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating invoice status:", error);
    res.status(500).json({ error: "Failed to update invoice status" });
  }
});

module.exports = router;
