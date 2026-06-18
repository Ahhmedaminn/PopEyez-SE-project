const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const pool = require("../db");

const router = express.Router();
const allowedStatuses = ["Pending Review", "Approved", "Paid", "Rejected"];
const invoiceUploadDir = path.join(__dirname, "..", "uploads", "invoices");
const allowedDocumentTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

fs.mkdirSync(invoiceUploadDir, { recursive: true });

const invoiceDocumentUpload = multer({
  storage: multer.diskStorage({
    destination: function (_req, _file, callback) {
      callback(null, invoiceUploadDir);
    },
    filename: function (_req, file, callback) {
      const extension = path.extname(file.originalname).toLowerCase();
      const safeBaseName = path.basename(file.originalname, extension)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) || "invoice-document";
      callback(null, `${Date.now()}-${safeBaseName}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function (_req, file, callback) {
    if (!allowedDocumentTypes.has(file.mimetype)) {
      callback(new Error("Only PDF, PNG, JPG, or JPEG invoice documents are allowed"));
      return;
    }

    callback(null, true);
  },
});

function removeUploadedFile(file) {
  if (!file?.path) return;
  fs.promises.unlink(file.path).catch(() => {});
}

function handleInvoiceUpload(req, res, next) {
  invoiceDocumentUpload.single("supporting_document")(req, res, function (error) {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Supporting document must be 5MB or smaller" });
      return;
    }

    res.status(400).json({ error: error.message || "Invalid supporting document upload" });
  });
}

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
        invoices.*,
        events.name AS event_name,
        vendors.company_name AS vendor_name
      FROM invoices
      JOIN events ON events.id = invoices.event_id
      JOIN vendors ON vendors.id = invoices.vendor_id
      ${whereClause}
      ORDER BY invoices.created_at DESC`,
      values
    );
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
    const result = await pool.query(
      `SELECT
        invoices.*,
        events.name AS event_name,
        events.event_date::text AS event_date,
        sourcing_requests.requested_items
      FROM invoices
      JOIN events ON events.id = invoices.event_id
      JOIN sourcing_requests ON sourcing_requests.id = invoices.sourcing_request_id
      WHERE invoices.vendor_id = $1
      ORDER BY invoices.created_at DESC`,
      [req.params.vendorId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor invoices:", error);
    res.status(500).json({ error: "Failed to fetch vendor invoices" });
  }
});

router.get("/vendor-user/:userId", async function (req, res) {
  try {
    const result = await pool.query(
      `SELECT
        invoices.*,
        events.name AS event_name,
        events.event_date::text AS event_date,
        sourcing_requests.requested_items
      FROM invoices
      JOIN vendors ON vendors.id = invoices.vendor_id
      JOIN events ON events.id = invoices.event_id
      JOIN sourcing_requests ON sourcing_requests.id = invoices.sourcing_request_id
      WHERE vendors.user_id = $1
      ORDER BY invoices.created_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor user invoices:", error);
    res.status(500).json({ error: "Failed to fetch vendor invoices" });
  }
});

router.post("/vendor-submit", handleInvoiceUpload, async function (req, res) {
  const {
    vendor_user_id,
    delivery_id,
    invoice_number,
    amount,
    itemized_breakdown,
    supporting_document_url,
  } = req.body;

  if (!vendor_user_id || !delivery_id) {
    removeUploadedFile(req.file);
    return res.status(400).json({ error: "vendor_user_id and delivery_id are required" });
  }

  if (!String(invoice_number || "").trim() || !String(itemized_breakdown || "").trim()) {
    removeUploadedFile(req.file);
    return res.status(400).json({ error: "invoice_number and itemized_breakdown are required" });
  }

  if (amount === undefined || amount === null || Number(amount) <= 0) {
    removeUploadedFile(req.file);
    return res.status(400).json({ error: "amount must be greater than 0" });
  }

  try {
    const deliveryResult = await pool.query(
      `SELECT
        deliveries.id AS delivery_id,
        deliveries.event_id,
        deliveries.vendor_id,
        deliveries.sourcing_request_id,
        EXISTS (
          SELECT 1
          FROM invoices
          WHERE invoices.delivery_id = deliveries.id
        ) AS has_invoice
      FROM deliveries
      JOIN vendors ON vendors.id = deliveries.vendor_id
      JOIN sourcing_requests ON sourcing_requests.id = deliveries.sourcing_request_id
      WHERE deliveries.id = $1
        AND vendors.user_id = $2
        AND sourcing_requests.status = 'Accepted'
        AND deliveries.status = 'Delivered'`,
      [delivery_id, vendor_user_id]
    );

    if (deliveryResult.rows.length === 0) {
      removeUploadedFile(req.file);
      return res.status(400).json({
        error: "Invoice can only be submitted for your own delivered accepted delivery",
      });
    }

    const delivery = deliveryResult.rows[0];

    if (delivery.has_invoice) {
      removeUploadedFile(req.file);
      return res.status(400).json({ error: "This delivery already has an invoice" });
    }

    const uploadedDocumentUrl = req.file ? `/uploads/invoices/${req.file.filename}` : null;
    const result = await pool.query(
      `INSERT INTO invoices (
        delivery_id, sourcing_request_id, event_id, vendor_id, invoice_number,
        amount, status, itemized_breakdown, supporting_document_url, submitted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'Pending Review', $7, $8, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        delivery.delivery_id,
        delivery.sourcing_request_id,
        delivery.event_id,
        delivery.vendor_id,
        String(invoice_number).trim(),
        amount,
        String(itemized_breakdown).trim(),
        uploadedDocumentUrl || (supporting_document_url ? String(supporting_document_url).trim() : null),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    removeUploadedFile(req.file);
    console.error("Error submitting vendor invoice:", error);
    res.status(500).json({ error: "Failed to submit invoice" });
  }
});

router.patch("/:id/status", async function (req, res) {
  const { status, organizer_id } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid invoice status" });
  }

  try {
    const result = await pool.query(
      `UPDATE invoices
      SET status = $1::varchar,
          reviewed_at = CASE
            WHEN $1::varchar IN ('Approved', 'Paid', 'Rejected') THEN CURRENT_TIMESTAMP
            ELSE reviewed_at
          END
      WHERE id = $2
        AND EXISTS (
          SELECT 1 FROM events
          WHERE events.id = invoices.event_id
            AND events.organizer_id = $3
        )
      RETURNING *`,
      [status, req.params.id, organizer_id]
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
