const express = require("express");
const pool = require("../db");
const { requireEventAccess } = require("../ownership");

const router = express.Router();
const allowedStatuses = ["Preparing", "Out for Delivery", "Delivered", "Delayed", "Arrived"];

router.get("/", async function (req, res) {
  const { organizer_id } = req.query;
  const values = [];
  const filters = [];

  if (organizer_id) {
    if (!/^\d+$/.test(organizer_id)) {
      return res.status(400).json({ error: "Invalid organizer_id" });
    }

    values.push(organizer_id);
    filters.push(`events.organizer_id = $${values.length}`);
  }

  try {
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT
        deliveries.*,
        events.name AS event_name,
        vendors.company_name AS vendor_name
      FROM deliveries
      JOIN events ON events.id = deliveries.event_id
      JOIN vendors ON vendors.id = deliveries.vendor_id
      ${whereClause}
      ORDER BY deliveries.scheduled_arrival ASC`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    res.status(500).json({ error: "Failed to fetch deliveries" });
  }
});

router.get("/event/:eventId", async function (req, res) {
  try {
    if (!(await requireEventAccess(
      pool,
      req.params.eventId,
      req.query.organizer_id,
      req.query.staff_id
    ))) {
      return res.status(403).json({ error: "You do not have access to this event" });
    }

    const result = await pool.query(
      `SELECT
        deliveries.*,
        events.name AS event_name,
        vendors.company_name AS vendor_name,
        sourcing_requests.requested_items,
        sourcing_requests.quantity,
        sourcing_requests.event_location
      FROM deliveries
      JOIN events ON events.id = deliveries.event_id
      JOIN vendors ON vendors.id = deliveries.vendor_id
      JOIN sourcing_requests ON sourcing_requests.id = deliveries.sourcing_request_id
      WHERE deliveries.event_id = $1
      ORDER BY deliveries.scheduled_arrival ASC`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event deliveries:", error);
    res.status(500).json({ error: "Failed to fetch event deliveries" });
  }
});

router.get("/vendor/:vendorId", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT
        deliveries.*,
        events.name AS event_name,
        events.event_date::text AS event_date,
        sourcing_requests.requested_items,
        sourcing_requests.quantity,
        sourcing_requests.event_location
      FROM deliveries
      JOIN events ON events.id = deliveries.event_id
      JOIN sourcing_requests ON sourcing_requests.id = deliveries.sourcing_request_id
      WHERE deliveries.vendor_id = $1
      ORDER BY deliveries.scheduled_arrival ASC`,
      [req.params.vendorId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor deliveries:", error);
    res.status(500).json({ error: "Failed to fetch vendor deliveries" });
  }
});

router.get("/vendor-user/:userId", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT
        deliveries.*,
        events.name AS event_name,
        events.event_date::text AS event_date,
        sourcing_requests.requested_items,
        sourcing_requests.quantity,
        sourcing_requests.event_location
      FROM deliveries
      JOIN vendors ON vendors.id = deliveries.vendor_id
      JOIN events ON events.id = deliveries.event_id
      JOIN sourcing_requests ON sourcing_requests.id = deliveries.sourcing_request_id
      WHERE vendors.user_id = $1
        AND sourcing_requests.status = 'Accepted'
      ORDER BY deliveries.scheduled_arrival ASC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor user deliveries:", error);
    res.status(500).json({ error: "Failed to fetch vendor deliveries" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status, organizer_id, staff_id } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid delivery status" });
  }

  if (staff_id && status !== "Arrived") {
    return res.status(400).json({ error: "Staff can only mark a delivery as Arrived" });
  }

  try {
    if (!organizer_id && !staff_id) {
      return res.status(400).json({ error: "organizer_id or staff_id is required" });
    }

    const accessClause = staff_id
      ? `EXISTS (
          SELECT 1 FROM tasks
          WHERE tasks.event_id = deliveries.event_id
            AND tasks.assigned_to = $3
            AND tasks.status <> 'Not Assigned'
        )`
      : `EXISTS (
          SELECT 1 FROM events
          WHERE events.id = deliveries.event_id
            AND events.organizer_id = $3
        )`;
    const result = await pool.query(
      `UPDATE deliveries
      SET status = $1::varchar,
          arrived_at = CASE WHEN $1::varchar = 'Arrived' THEN CURRENT_TIMESTAMP ELSE arrived_at END
      WHERE id = $2
        AND ${accessClause}
      RETURNING *`,
      [status, req.params.id, staff_id || organizer_id]
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

router.patch("/:id/vendor-status", async function (req, res) {
  const { status, vendor_user_id, confirmation_notes } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid delivery status" });
  }

  if (!vendor_user_id) {
    return res.status(400).json({ error: "vendor_user_id is required" });
  }

  if (status === "Delayed" && !String(confirmation_notes || "").trim()) {
    return res.status(400).json({ error: "A delay note is required when marking a delivery as Delayed" });
  }

  try {
    const result = await pool.query(
      `UPDATE deliveries
      SET
        status = $1::varchar,
        confirmation_notes = COALESCE($2, confirmation_notes),
        arrived_at = CASE
          WHEN $1::varchar IN ('Arrived', 'Delivered') THEN COALESCE(arrived_at, CURRENT_TIMESTAMP)
          ELSE arrived_at
        END
      WHERE id = $3
        AND EXISTS (
          SELECT 1
          FROM vendors
          WHERE vendors.id = deliveries.vendor_id
            AND vendors.user_id = $4
        )
      RETURNING *`,
      [
        status,
        String(confirmation_notes || "").trim() || null,
        req.params.id,
        vendor_user_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Delivery not found for this vendor" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating vendor delivery status:", error);
    res.status(500).json({ error: "Failed to update delivery status" });
  }
});

module.exports = router;
