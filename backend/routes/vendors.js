const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM vendors WHERE status = 'Active' ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

router.get("/search", async function (req, res) {
  const { company_name, supplies_offered, main_location } = req.query;
  const filters = ["status = 'Active'"];
  const values = [];

  if (company_name) {
    values.push(`%${company_name}%`);
    filters.push(`company_name ILIKE $${values.length}`);
  }

  if (supplies_offered) {
    values.push(`%${supplies_offered}%`);
    filters.push(`supplies_offered ILIKE $${values.length}`);
  }

  if (main_location) {
    values.push(`%${main_location}%`);
    filters.push(`main_location ILIKE $${values.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT * FROM vendors WHERE ${filters.join(" AND ")} ORDER BY id ASC`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error searching vendors:", error);
    res.status(500).json({ error: "Failed to search vendors" });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM vendors WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

module.exports = router;
