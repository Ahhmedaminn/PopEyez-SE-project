import { useEffect, useState } from 'react'
import { apiGet } from '../api'

const taskStatuses = ['Pending', 'In Progress', 'Done', 'Overdue']

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'No date'
}

function getUniqueEvents(tasks) {
  const eventsById = new Map()

  tasks.forEach((task) => {
    if (!eventsById.has(task.event_id)) {
      eventsById.set(task.event_id, {
        id: task.event_id,
        name: task.event_name,
        event_date: task.event_date,
        status: task.event_status,
      })
    }
  })

  return Array.from(eventsById.values())
}

function StaffDashboard({ currentUser }) {
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      try {
        const data = await apiGet(`/tasks/staff/${currentUser.id}`)

        if (!ignore) {
          setTasks(data)
          setError('')
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Could not load staff dashboard.')
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
    return <section className="page-panel">Loading staff dashboard...</section>
  }

  if (error) {
    return <section className="page-panel error-panel">{error}</section>
  }

  const events = getUniqueEvents(tasks)
  const upcomingTasks = tasks
    .filter((task) => task.status !== 'Done')
    .slice(0, 5)

  return (
    <div className="dashboard">
      <div className="section-heading">
        <p className="eyebrow">Team member</p>
        <h1>Staff Dashboard</h1>
        <p>Assigned event work, operational responsibilities, and upcoming tasks.</p>
      </div>

      <section className="stats-grid">
        <article>
          <span>Staff member</span>
          <strong>{currentUser.full_name}</strong>
        </article>
        <article>
          <span>Speciality</span>
          <strong>{currentUser.speciality || 'Not set'}</strong>
        </article>
        <article>
          <span>Employment</span>
          <strong>{currentUser.employment_type || 'Not set'}</strong>
        </article>
        <article>
          <span>Assigned events</span>
          <strong>{events.length}</strong>
        </article>
      </section>

      <section className="stats-grid">
        {taskStatuses.map((status) => (
          <article key={status}>
            <span>{status}</span>
            <strong>{tasks.filter((task) => task.status === status).length}</strong>
          </article>
        ))}
      </section>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header">
            <h2>Upcoming Task Summary</h2>
            <span>{upcomingTasks.length}</span>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="empty-state">No open tasks assigned.</p>
          ) : (
            <ul className="list data-list">
              {upcomingTasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong>
                  <span>{task.event_name} - due {formatDate(task.due_date)} - {task.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header">
            <h2>Assigned Events</h2>
            <span>{events.length}</span>
          </div>
          {events.length === 0 ? (
            <p className="empty-state">No assigned events yet.</p>
          ) : (
            <ul className="list data-list">
              {events.map((event) => (
                <li key={event.id}>
                  <strong>{event.name}</strong>
                  <span>{formatDate(event.event_date)} - {event.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default StaffDashboard
