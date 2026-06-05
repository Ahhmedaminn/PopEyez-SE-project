const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM venue_availability ORDER BY available_date ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching venue availability:", error);
    res.status(500).json({ error: "Failed to fetch venue availability" });
  }
});

router.get("/venue/:venueId", async function (req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM venue_availability WHERE venue_id = $1 ORDER BY available_date ASC",
      [req.params.venueId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching venue availability:", error);
    res.status(500).json({ error: "Failed to fetch venue availability" });
  }
});

router.get("/date/:date", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT venues.*, venue_availability.available_date, venue_availability.price_override
      FROM venue_availability
      JOIN venues ON venues.id = venue_availability.venue_id
      WHERE venue_availability.available_date = $1
        AND venue_availability.is_available = TRUE
        AND venues.status = 'Active'
      ORDER BY venues.id ASC`,
      [req.params.date]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching available venues by date:", error);
    res.status(500).json({ error: "Failed to fetch available venues by date" });
  }
});

module.exports = router;
