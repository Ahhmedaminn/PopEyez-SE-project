const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", function (req, res) {
  res.send("PopEyez backend is running");
});

// Test database connection
app.get("/api/test-db", async function (req, res) {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      error: "Database connection failed",
    });
  }
});

// First real API route: get all events
app.get("/api/events", async function (req, res) {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY event_date ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      error: "Failed to fetch events",
    });
  }
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, function () {
  console.log("Server running on http://localhost:" + PORT);
});