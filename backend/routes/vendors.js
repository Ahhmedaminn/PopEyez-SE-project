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
  const { q, company_name, supplies_offered, main_location } = req.query;
  const filters = ["status = 'Active'"];
  const values = [];

  if (q) {
    values.push(`%${q}%`);
    filters.push(`(
      company_name ILIKE $${values.length}
      OR supplies_offered ILIKE $${values.length}
      OR main_location ILIKE $${values.length}
      OR pricing_list ILIKE $${values.length}
    )`);
  }

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

router.get("/by-user/:userId", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT vendors.*
      FROM vendors
      JOIN users ON users.id = vendors.user_id
      WHERE vendors.user_id = $1
        AND users.role = 'vendor'
        AND users.status = 'Active'`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor profile not found for this user" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    res.status(500).json({ error: "Failed to fetch vendor profile" });
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

router.put("/by-user/:userId", async function (req, res) {
  const {
    company_name,
    supplies_offered,
    main_location,
    pricing_list,
    contact_email,
    contact_phone,
  } = req.body;

  if (!String(company_name || "").trim() || !String(supplies_offered || "").trim()) {
    return res.status(400).json({ error: "company_name and supplies_offered are required" });
  }

  try {
    const userResult = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'vendor' AND status = 'Active'",
      [req.params.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: "Only an active vendor user can update a vendor profile" });
    }

    const result = await pool.query(
      `UPDATE vendors
      SET
        company_name = $1,
        supplies_offered = $2,
        main_location = $3,
        pricing_list = $4,
        contact_email = $5,
        contact_phone = $6
      WHERE user_id = $7
      RETURNING *`,
      [
        String(company_name).trim(),
        String(supplies_offered).trim(),
        main_location ? String(main_location).trim() : null,
        pricing_list ? String(pricing_list).trim() : null,
        contact_email ? String(contact_email).trim() : null,
        contact_phone ? String(contact_phone).trim() : null,
        req.params.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor profile not found" });
    }

    await pool.query(
      `UPDATE users
      SET company_name = $1
      WHERE id = $2`,
      [String(company_name).trim(), req.params.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating vendor profile:", error);
    res.status(500).json({ error: "Failed to update vendor profile" });
  }
});

module.exports = router;
