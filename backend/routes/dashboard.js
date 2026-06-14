const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/organizer", async function (req, res) {
  const { organizer_id } = req.query;

  if (!organizer_id || !/^\d+$/.test(organizer_id)) {
    return res.status(400).json({
      error: "A valid organizer_id is required",
    });
  }

  try {
    await pool.query(
      `UPDATE tasks
      SET status = 'Overdue'
      FROM events
      WHERE tasks.event_id = events.id
        AND events.organizer_id = $1
        AND tasks.due_date < CURRENT_DATE
        AND tasks.status NOT IN ('Done', 'Overdue')`,
      [organizer_id]
    );

    const todayEventsResult = await pool.query(
      `SELECT *
      FROM events
      WHERE organizer_id = $1
        AND event_date = CURRENT_DATE
      ORDER BY start_time ASC`,
      [organizer_id]
    );

    const upcomingEventsResult = await pool.query(
      `SELECT *
      FROM events
      WHERE organizer_id = $1
        AND event_date > CURRENT_DATE
        AND status IN ('Planned', 'Ongoing')
      ORDER BY event_date ASC`,
      [organizer_id]
    );

    const taskCountsResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE tasks.status = 'Pending') AS pending_tasks_count,
        COUNT(*) FILTER (WHERE tasks.status = 'In Progress') AS in_progress_tasks_count,
        COUNT(*) FILTER (WHERE tasks.status = 'Done') AS done_tasks_count,
        COUNT(*) FILTER (WHERE tasks.status = 'Overdue') AS overdue_tasks_count
      FROM tasks
      JOIN events ON events.id = tasks.event_id
      WHERE events.organizer_id = $1`,
      [organizer_id]
    );

    const dueSoonTasksResult = await pool.query(
      `SELECT
        tasks.*,
        tasks.due_date::text AS due_date,
        events.name AS event_name
      FROM tasks
      JOIN events ON events.id = tasks.event_id
      WHERE events.organizer_id = $1
        AND tasks.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
        AND tasks.status IN ('Not Assigned', 'Pending', 'In Progress')
      ORDER BY tasks.due_date ASC`,
      [organizer_id]
    );

    const guestCountsResult = await pool.query(
      `SELECT COUNT(guests.id) AS total_guests
      FROM guests
      JOIN events ON events.id = guests.event_id
      WHERE events.organizer_id = $1
        AND events.event_date >= CURRENT_DATE
        AND events.status IN ('Planned', 'Ongoing')`
      ,
      [organizer_id]
    );

    const arrivedGuestsResult = await pool.query(
      `SELECT COUNT(checkins.id) AS arrived_guests_count
      FROM checkins
      JOIN events ON events.id = checkins.event_id
      WHERE events.organizer_id = $1
        AND checkins.status = 'Arrived'
        AND events.event_date >= CURRENT_DATE
        AND events.status IN ('Planned', 'Ongoing')`,
      [organizer_id]
    );

    const deliveriesTodayResult = await pool.query(
      `SELECT deliveries.*
      FROM deliveries
      JOIN events ON events.id = deliveries.event_id
      WHERE events.organizer_id = $1
        AND DATE(deliveries.scheduled_arrival) = CURRENT_DATE
      ORDER BY deliveries.scheduled_arrival ASC`,
      [organizer_id]
    );

    const feedbackSummaryResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE feedback.sentiment = 'Positive') AS positive_feedback_count,
        COUNT(*) FILTER (WHERE feedback.sentiment = 'Negative') AS negative_feedback_count,
        ROUND(AVG(feedback.overall_rating) FILTER (WHERE feedback.sentiment = 'Positive'), 2)
          AS average_positive_feedback_rating,
        ROUND(AVG(feedback.overall_rating) FILTER (WHERE feedback.sentiment = 'Negative'), 2)
          AS average_negative_feedback_rating
      FROM feedback
      JOIN events ON events.id = feedback.event_id
      WHERE events.organizer_id = $1`,
      [organizer_id]
    );

    const taskCounts = taskCountsResult.rows[0];
    const feedbackSummary = feedbackSummaryResult.rows[0];

    res.json({
      todays_events: todayEventsResult.rows,
      upcoming_events: upcomingEventsResult.rows,
      due_soon_tasks: dueSoonTasksResult.rows,
      pending_tasks_count: Number(taskCounts.pending_tasks_count),
      in_progress_tasks_count: Number(taskCounts.in_progress_tasks_count),
      done_tasks_count: Number(taskCounts.done_tasks_count),
      overdue_tasks_count: Number(taskCounts.overdue_tasks_count),
      total_guests_across_upcoming_planned_events: Number(guestCountsResult.rows[0].total_guests),
      arrived_guests_count: Number(arrivedGuestsResult.rows[0].arrived_guests_count),
      vendor_deliveries_today: deliveriesTodayResult.rows,
      positive_feedback_count: Number(feedbackSummary.positive_feedback_count),
      negative_feedback_count: Number(feedbackSummary.negative_feedback_count),
      average_positive_feedback_rating: feedbackSummary.average_positive_feedback_rating === null
        ? null
        : Number(feedbackSummary.average_positive_feedback_rating),
      average_negative_feedback_rating: feedbackSummary.average_negative_feedback_rating === null
        ? null
        : Number(feedbackSummary.average_negative_feedback_rating),
    });
  } catch (error) {
    console.error("Error fetching organizer dashboard:", error);
    res.status(500).json({
      error: "Failed to fetch organizer dashboard",
    });
  }
});

module.exports = router;
