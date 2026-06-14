import { useEffect, useState } from 'react'
import { apiGet } from '../api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'No date'
}

function getEventsFromTasks(tasks) {
  const eventsById = new Map()

  tasks.forEach((task) => {
    if (!eventsById.has(task.event_id)) {
      eventsById.set(task.event_id, {
        id: task.event_id,
        name: task.event_name,
        event_type: task.event_type,
        description: task.event_description,
        event_date: task.event_date,
        start_time: task.start_time,
        end_time: task.end_time,
        expected_attendees: task.expected_attendees,
        dress_code: task.dress_code,
        agenda: task.agenda,
        status: task.event_status,
        task_count: 0,
      })
    }

    eventsById.get(task.event_id).task_count += 1
  })

  return Array.from(eventsById.values()).sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
}

function StaffEvents({ currentUser }) {
  const [events, setEvents] = useState([])
  const [dateFilter, setDateFilter] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadEvents() {
      try {
        const tasks = await apiGet(`/tasks/staff/${currentUser.id}`)
        setEvents(getEventsFromTasks(tasks))
        setMessage('')
      } catch (err) {
        setMessage(err.message || 'Could not load assigned events.')
      }
    }

    loadEvents()
  }, [currentUser.id])

  const visibleEvents = dateFilter
    ? events.filter((event) => event.event_date?.slice(0, 10) === dateFilter)
    : events

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Assigned events</p>
        <h1>My Event Details</h1>
        <p>Events connected to your assigned operational tasks.</p>
      </div>

      <section className="page-panel toolbar-panel">
        <label>
          Event date
          <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        </label>
      </section>

      {message && <p className="error-text">{message}</p>}

      <section className="page-panel">
        <div className="panel-header">
          <h2>Assigned Events</h2>
          <span>{visibleEvents.length}</span>
        </div>
        {visibleEvents.length === 0 ? (
          <p className="empty-state">No assigned events to show.</p>
        ) : (
          <ul className="list data-list">
            {visibleEvents.map((event) => (
              <li key={event.id}>
                <strong>{event.name}</strong>
                <span>{formatDate(event.event_date)} - {event.start_time || 'No start'} to {event.end_time || 'No end'} - {event.status}</span>
                <span>{event.event_type || 'No type'} - {event.expected_attendees || 0} expected guests</span>
                <span>{event.description || 'No description'}</span>
                <span>Dress code: {event.dress_code || 'Not specified'} - Tasks assigned to you: {event.task_count}</span>
                <span>Agenda: {event.agenda || 'No agenda saved'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default StaffEvents
