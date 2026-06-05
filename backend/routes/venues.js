const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM venues WHERE status = 'Active' ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ error: "Failed to fetch venues" });
  }
});

router.get("/search", async function (req, res) {
  const { city, minCapacity, maxPrice } = req.query;
  const filters = ["status = 'Active'"];
  const values = [];

  if (city) {
    values.push(city);
    filters.push(`city = $${values.length}`);
  }

  if (minCapacity) {
    values.push(minCapacity);
    filters.push(`capacity >= $${values.length}`);
  }

  if (maxPrice) {
    values.push(maxPrice);
    filters.push(`daily_price <= $${values.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT * FROM venues WHERE ${filters.join(" AND ")} ORDER BY id ASC`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error searching venues:", error);
    res.status(500).json({ error: "Failed to search venues" });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM venues WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching venue:", error);
    res.status(500).json({ error: "Failed to fetch venue" });
  }
});

module.exports = router;
