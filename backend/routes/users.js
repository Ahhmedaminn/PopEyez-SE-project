const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedUserStatuses = ["Active", "Deactivated"];
const allowedRoles = ["organizer", "staff", "vendor", "guest", "venueOwner"];
const allowedEmploymentTypes = ["part-time", "full-time"];

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

router.get("/", async function (req, res) {
  const { role, status, employment_type, speciality } = req.query;
  const filters = [];
  const values = [];

  if (role) {
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid user role",
      });
    }

    values.push(role);
    filters.push(`role = $${values.length}`);
  }

  if (status) {
    if (!allowedUserStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid user status",
      });
    }

    values.push(status);
    filters.push(`status = $${values.length}`);
  }

  if (employment_type) {
    if (!allowedEmploymentTypes.includes(employment_type)) {
      return res.status(400).json({
        error: "Invalid employment_type",
      });
    }

    values.push(employment_type);
    filters.push(`employment_type = $${values.length}`);
  }

  if (speciality) {
    values.push(`%${speciality}%`);
    filters.push(`speciality ILIKE $${values.length}`);
  }

  try {
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(`SELECT * FROM users ${whereClause} ORDER BY id ASC`, values);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
});

router.get("/:id", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      error: "Failed to fetch user",
    });
  }
});

router.post("/", async function (req, res) {
  const {
    full_name,
    email,
    password_hash,
    role,
    status,
    phone,
    age,
    speciality,
    employment_type,
    company_name,
    created_by,
  } = req.body;

  if (isMissing(full_name) || isMissing(email) || isMissing(role)) {
    return res.status(400).json({
      error: "full_name, email, and role are required",
    });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      error: "Invalid user role",
    });
  }

  if (status && !allowedUserStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid user status",
    });
  }

  if (employment_type && !allowedEmploymentTypes.includes(employment_type)) {
    return res.status(400).json({
      error: "Invalid employment_type",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (
        full_name, email, password_hash, role, status, phone, age,
        speciality, employment_type, company_name, created_by
      )
      VALUES ($1, $2, $3, $4, COALESCE($5, 'Active'), $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        full_name,
        email,
        password_hash || null,
        role,
        status || null,
        phone || null,
        age || null,
        speciality || null,
        employment_type || null,
        company_name || null,
        created_by || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      error: "Failed to create user",
    });
  }
});

router.put("/:id", async function (req, res) {
  const {
    full_name,
    email,
    password_hash,
    role,
    status,
    phone,
    age,
    speciality,
    employment_type,
    company_name,
    created_by,
  } = req.body;

  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({
      error: "Invalid user role",
    });
  }

  if (status && !allowedUserStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid user status",
    });
  }

  if (employment_type && !allowedEmploymentTypes.includes(employment_type)) {
    return res.status(400).json({
      error: "Invalid employment_type",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users
      SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        password_hash = COALESCE($3, password_hash),
        role = COALESCE($4, role),
        status = COALESCE($5, status),
        phone = COALESCE($6, phone),
        age = COALESCE($7, age),
        speciality = COALESCE($8, speciality),
        employment_type = COALESCE($9, employment_type),
        company_name = COALESCE($10, company_name),
        created_by = COALESCE($11, created_by)
      WHERE id = $12
      RETURNING *`,
      [
        full_name || null,
        email || null,
        password_hash || null,
        role || null,
        status || null,
        phone || null,
        age || null,
        speciality || null,
        employment_type || null,
        company_name || null,
        created_by || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      error: "Failed to update user",
    });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status } = req.body;

  if (!allowedUserStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid user status",
    });
  }

  try {
    const result = await pool.query("UPDATE users SET status = $1 WHERE id = $2 RETURNING *", [
      status,
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      error: "Failed to update user status",
    });
  }
});

module.exports = router;
