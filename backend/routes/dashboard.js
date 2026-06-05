const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/organizer", async function (req, res) {
  try {
    const todayEventsResult = await pool.query(
      "SELECT * FROM events WHERE event_date = CURRENT_DATE ORDER BY start_time ASC"
    );

    const upcomingEventsResult = await pool.query(
      `SELECT *
      FROM events
      WHERE event_date >= CURRENT_DATE
        AND status IN ('Planned', 'Ongoing')
      ORDER BY event_date ASC`
    );

    const taskCountsResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending_tasks_count,
        COUNT(*) FILTER (WHERE status = 'In Progress') AS in_progress_tasks_count,
        COUNT(*) FILTER (WHERE status = 'Done') AS done_tasks_count,
        COUNT(*) FILTER (WHERE status = 'Overdue') AS overdue_tasks_count
      FROM tasks`
    );

    const guestCountsResult = await pool.query(
      `SELECT COUNT(guests.id) AS total_guests
      FROM guests
      JOIN events ON events.id = guests.event_id
      WHERE events.event_date >= CURRENT_DATE
        AND events.status IN ('Planned', 'Ongoing')`
    );

    const arrivedGuestsResult = await pool.query(
      `SELECT COUNT(checkins.id) AS arrived_guests_count
      FROM checkins
      JOIN events ON events.id = checkins.event_id
      WHERE checkins.status = 'Arrived'
        AND events.event_date >= CURRENT_DATE
        AND events.status IN ('Planned', 'Ongoing')`
    );

    const deliveriesTodayResult = await pool.query(
      `SELECT *
      FROM deliveries
      WHERE DATE(scheduled_arrival) = CURRENT_DATE
      ORDER BY scheduled_arrival ASC`
    );

    const feedbackCountsResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE sentiment = 'Positive') AS positive_feedback_count,
        COUNT(*) FILTER (WHERE sentiment = 'Negative') AS negative_feedback_count
      FROM feedback`
    );

    const taskCounts = taskCountsResult.rows[0];
    const feedbackCounts = feedbackCountsResult.rows[0];

    res.json({
      todays_events: todayEventsResult.rows,
      upcoming_events: upcomingEventsResult.rows,
      pending_tasks_count: Number(taskCounts.pending_tasks_count),
      in_progress_tasks_count: Number(taskCounts.in_progress_tasks_count),
      done_tasks_count: Number(taskCounts.done_tasks_count),
      overdue_tasks_count: Number(taskCounts.overdue_tasks_count),
      total_guests_across_upcoming_planned_events: Number(guestCountsResult.rows[0].total_guests),
      arrived_guests_count: Number(arrivedGuestsResult.rows[0].arrived_guests_count),
      vendor_deliveries_today: deliveriesTodayResult.rows,
      positive_feedback_count: Number(feedbackCounts.positive_feedback_count),
      negative_feedback_count: Number(feedbackCounts.negative_feedback_count),
    });
  } catch (error) {
    console.error("Error fetching organizer dashboard:", error);
    res.status(500).json({
      error: "Failed to fetch organizer dashboard",
    });
  }
});

module.exports = router;
