const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/event/:eventId", async function (req, res) {
  const { eventId } = req.params;

  try {
    const eventResult = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    const budgetResult = await pool.query(
      "SELECT COALESCE(SUM(planned_amount), 0) AS total_planned_budget FROM budgets WHERE event_id = $1",
      [eventId]
    );

    const expenseResult = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_actual_expenses FROM expenses WHERE event_id = $1",
      [eventId]
    );

    const guestResult = await pool.query("SELECT COUNT(*) AS total_guests FROM guests WHERE event_id = $1", [
      eventId,
    ]);

    const checkinResult = await pool.query(
      "SELECT COUNT(*) AS arrived_guests FROM checkins WHERE event_id = $1 AND status = 'Arrived'",
      [eventId]
    );

    const feedbackResult = await pool.query(
      "SELECT ROUND(AVG(overall_rating), 2) AS average_overall_rating FROM feedback WHERE event_id = $1",
      [eventId]
    );

    const totalPlannedBudget = Number(budgetResult.rows[0].total_planned_budget);
    const totalActualExpenses = Number(expenseResult.rows[0].total_actual_expenses);
    const totalGuests = Number(guestResult.rows[0].total_guests);
    const arrivedGuests = Number(checkinResult.rows[0].arrived_guests);
    const averageOverallRating = feedbackResult.rows[0].average_overall_rating;

    res.json({
      event: eventResult.rows[0],
      total_planned_budget: totalPlannedBudget,
      total_actual_expenses: totalActualExpenses,
      budget_difference: totalPlannedBudget - totalActualExpenses,
      total_guests: totalGuests,
      arrived_guests: arrivedGuests,
      not_arrived_guests: totalGuests - arrivedGuests,
      average_overall_rating: averageOverallRating === null ? null : Number(averageOverallRating),
    });
  } catch (error) {
    console.error("Error fetching event report:", error);
    res.status(500).json({
      error: "Failed to fetch event report",
    });
  }
});

module.exports = router;
