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
  const { role, status, employment_type, speciality, created_by } = req.query;
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

  if (created_by) {
    if (!/^\d+$/.test(created_by)) {
      return res.status(400).json({
        error: "Invalid created_by",
      });
    }

    values.push(created_by);
    filters.push(`created_by = $${values.length}`);
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
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      if (created_by) {
        if (!["staff", "vendor", "guest"].includes(role)) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "Organizers can only create staff, vendor, or guest accounts",
          });
        }

        const creatorResult = await client.query(
          "SELECT 1 FROM users WHERE id = $1 AND role = 'organizer' AND status = 'Active'",
          [created_by]
        );

        if (creatorResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(403).json({
            error: "A valid active organizer is required",
          });
        }
      }

      if (role === "vendor" && isMissing(company_name)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "company_name is required for vendor accounts",
        });
      }

      const result = await client.query(
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

      const createdUser = result.rows[0];

      if (role === "vendor") {
        await client.query(
          `INSERT INTO vendors (
            user_id, company_name, supplies_offered, main_location,
            pricing_list, contact_email, contact_phone, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')
          ON CONFLICT (user_id) DO NOTHING`,
          [
            createdUser.id,
            String(company_name).trim(),
            "To be updated by vendor",
            null,
            null,
            email,
            phone || null,
          ]
        );
      }

      await client.query("COMMIT");
      res.status(201).json(createdUser);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
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
    actor_id,
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
    if (String(actor_id || "") !== String(req.params.id)) {
      return res.status(403).json({
        error: "Users can only update their own profile",
      });
    }

    if (role || status || created_by) {
      return res.status(400).json({
        error: "Profile updates cannot change role, status, or ownership",
      });
    }

    const result = await pool.query(
      `UPDATE users
      SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        password_hash = COALESCE($3, password_hash),
        role = role,
        status = status,
        phone = COALESCE($6, phone),
        age = COALESCE($7, age),
        speciality = COALESCE($8, speciality),
        employment_type = COALESCE($9, employment_type),
        company_name = COALESCE($10, company_name),
        created_by = created_by
      WHERE id = $12
      RETURNING *`,
      [
        full_name || null,
        email || null,
        password_hash || null,
        null,
        null,
        phone || null,
        age || null,
        speciality || null,
        employment_type || null,
        company_name || null,
        null,
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
  const { status, organizer_id } = req.body;

  if (!allowedUserStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid user status",
    });
  }

  if (!/^\d+$/.test(String(organizer_id || ""))) {
    return res.status(400).json({
      error: "organizer_id is required",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users
      SET status = $1
      WHERE id = $2
        AND created_by = $3
        AND role IN ('staff', 'vendor', 'guest', 'venueOwner')
      RETURNING *`,
      [status, req.params.id, organizer_id]
    );

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
