const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const eventsRoutes = require("./routes/events");
const usersRoutes = require("./routes/users");
const tasksRoutes = require("./routes/tasks");
const budgetsRoutes = require("./routes/budgets");
const expensesRoutes = require("./routes/expenses");

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

app.use("/api/events", eventsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/expenses", expensesRoutes);

const PORT = process.env.PORT || 5050;

app.listen(PORT, function () {
  console.log("Server running on http://localhost:" + PORT);
});
