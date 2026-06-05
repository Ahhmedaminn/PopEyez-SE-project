const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const eventsRoutes = require("./routes/events");
const usersRoutes = require("./routes/users");
const tasksRoutes = require("./routes/tasks");
const budgetsRoutes = require("./routes/budgets");
const expensesRoutes = require("./routes/expenses");
const reportsRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");
const feedbackRoutes = require("./routes/feedback");
const venuesRoutes = require("./routes/venues");
const venueAvailabilityRoutes = require("./routes/venueAvailability");
const bookingRequestsRoutes = require("./routes/bookingRequests");
const layoutsRoutes = require("./routes/layouts");
const vendorsRoutes = require("./routes/vendors");
const sourcingRequestsRoutes = require("./routes/sourcingRequests");
const deliveriesRoutes = require("./routes/deliveries");
const invoicesRoutes = require("./routes/invoices");
const guestsRoutes = require("./routes/guests");
const invitationsRoutes = require("./routes/invitations");
const rsvpsRoutes = require("./routes/rsvps");
const messagesRoutes = require("./routes/messages");
const checkinsRoutes = require("./routes/checkins");

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
app.use("/api/reports", reportsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/venues", venuesRoutes);
app.use("/api/venue-availability", venueAvailabilityRoutes);
app.use("/api/booking-requests", bookingRequestsRoutes);
app.use("/api/layouts", layoutsRoutes);
app.use("/api/vendors", vendorsRoutes);
app.use("/api/sourcing-requests", sourcingRequestsRoutes);
app.use("/api/deliveries", deliveriesRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/guests", guestsRoutes);
app.use("/api/invitations", invitationsRoutes);
app.use("/api/rsvps", rsvpsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/checkins", checkinsRoutes);

const PORT = process.env.PORT || 5050;

app.listen(PORT, function () {
  console.log("Server running on http://localhost:" + PORT);
});
