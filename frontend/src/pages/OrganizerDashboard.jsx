import { useEffect, useState } from 'react'
import { apiGet } from '../api'

function formatDate(value) {
  if (!value) {
    return 'No date'
  }

  return new Date(value).toLocaleDateString()
}

function EventList({ title, events }) {
  return (
    <section className="page-panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <span>{events.length}</span>
      </div>

      {events.length === 0 ? (
        <p className="empty-state">No events to show.</p>
      ) : (
        <ul className="list">
          {events.map((event) => (
            <li key={event.id}>
              <strong>{event.name}</strong>
              <span>
                {formatDate(event.event_date)} · {event.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function OrganizerDashboard({ currentUser }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      try {
        const data = await apiGet(`/dashboard/organizer?organizer_id=${currentUser.id}`)

        if (!ignore) {
          setDashboard(data)
          setError('')
        }
      } catch {
        if (!ignore) {
          setError('Could not load organizer dashboard. Make sure the backend is running on port 5050.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      ignore = true
    }
  }, [currentUser.id])

  if (loading) {
    return <section className="page-panel">Loading organizer dashboard...</section>
  }

  if (error) {
    return <section className="page-panel error-panel">{error}</section>
  }

  return (
    <div className="dashboard">
      <div className="section-heading">
        <p className="eyebrow">Event organizer</p>
        <h1>Organizer Dashboard</h1>
        <p>Daily event, task, guest, delivery, and feedback overview.</p>
      </div>

      <section className="stats-grid">
        <article>
          <span>Pending tasks</span>
          <strong>{dashboard.pending_tasks_count}</strong>
        </article>
        <article>
          <span>In progress</span>
          <strong>{dashboard.in_progress_tasks_count}</strong>
        </article>
        <article>
          <span>Done</span>
          <strong>{dashboard.done_tasks_count}</strong>
        </article>
        <article>
          <span>Overdue</span>
          <strong>{dashboard.overdue_tasks_count}</strong>
        </article>
        <article>
          <span>Upcoming guests</span>
          <strong>{dashboard.total_guests_across_upcoming_planned_events}</strong>
        </article>
        <article>
          <span>Arrived guests</span>
          <strong>{dashboard.arrived_guests_count}</strong>
        </article>
        <article>
          <span>Positive feedback average</span>
          <strong>
            {dashboard.average_positive_feedback_rating === null
              ? 'N/A'
              : `${dashboard.average_positive_feedback_rating} / 5`}
          </strong>
          <small>
            {dashboard.positive_feedback_count} positive {dashboard.positive_feedback_count === 1 ? 'response' : 'responses'}
          </small>
        </article>
        <article>
          <span>Negative feedback average</span>
          <strong>
            {dashboard.average_negative_feedback_rating === null
              ? 'N/A'
              : `${dashboard.average_negative_feedback_rating} / 5`}
          </strong>
          <small>
            {dashboard.negative_feedback_count} negative {dashboard.negative_feedback_count === 1 ? 'response' : 'responses'}
          </small>
        </article>
      </section>

      <div className="dashboard-grid">
        <EventList title="Today's Events" events={dashboard.todays_events || []} />
        <EventList title="Upcoming Events" events={dashboard.upcoming_events || []} />

        <section className="page-panel">
          <div className="panel-header">
            <h2>Due Soon Tasks</h2>
            <span>{dashboard.due_soon_tasks?.length || 0}</span>
          </div>

          {!dashboard.due_soon_tasks?.length ? (
            <p className="empty-state">No unfinished tasks are due in the next seven days.</p>
          ) : (
            <ul className="list">
              {dashboard.due_soon_tasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong>
                  <span>
                    {task.event_name} · due {formatDate(`${task.due_date}T00:00:00`)} · {task.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header">
            <h2>Vendor Deliveries Today</h2>
            <span>{dashboard.vendor_deliveries_today?.length || 0}</span>
          </div>

          {!dashboard.vendor_deliveries_today?.length ? (
            <p className="empty-state">No deliveries scheduled today.</p>
          ) : (
            <ul className="list">
              {dashboard.vendor_deliveries_today.map((delivery) => (
                <li key={delivery.id}>
                  <strong>Delivery #{delivery.id}</strong>
                  <span>{delivery.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default OrganizerDashboard
