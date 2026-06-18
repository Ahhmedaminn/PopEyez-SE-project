/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api'
import DateSelect from '../components/DateSelect'

const taskStatuses = ['Not Assigned', 'Pending', 'In Progress', 'Done', 'Overdue']

function getTomorrowDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

function EventsTasks({ currentUser }) {
  const today = new Date().toISOString().slice(0, 10)
  const currentYear = Number(today.slice(0, 4))
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [eventFilters, setEventFilters] = useState({ status: '', date: '' })
  const [taskFilters, setTaskFilters] = useState({ status: '', event_id: '' })
  const [message, setMessage] = useState('')
  const [eventForm, setEventForm] = useState({
    name: '',
    event_date: '',
    event_type: '',
    expected_attendees: '',
    status: 'Planned',
  })
  const [taskForm, setTaskForm] = useState({
    event_id: '',
    title: '',
    assigned_to: '',
    due_date: '',
    status: 'Pending',
  })
  const tomorrowDate = getTomorrowDate()

  async function loadData() {
    const eventParams = new URLSearchParams()
    const taskParams = new URLSearchParams()

    if (eventFilters.status) eventParams.set('status', eventFilters.status)
    if (eventFilters.date) eventParams.set('date', eventFilters.date)
    eventParams.set('organizer_id', currentUser.id)
    if (taskFilters.status) taskParams.set('status', taskFilters.status)
    if (taskFilters.event_id) taskParams.set('event_id', taskFilters.event_id)
    taskParams.set('organizer_id', currentUser.id)

    const [eventsData, tasksData, usersData] = await Promise.all([
      apiGet(`/events${eventParams.toString() ? `?${eventParams}` : ''}`),
      apiGet(`/tasks${taskParams.toString() ? `?${taskParams}` : ''}`),
      apiGet(`/users?role=staff&status=Active&created_by=${currentUser.id}`),
    ])

    setEvents(eventsData)
    setTasks(tasksData)
    setUsers(usersData)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => setMessage('Could not load events and tasks.'))
  }, [eventFilters, taskFilters])

  async function createEvent(event) {
    event.preventDefault()
    if (!currentUser?.id) {
      setMessage('Please log in as an organizer before creating events.')
      return
    }

    try {
      await apiPost('/events', {
        organizer_id: currentUser.id,
        name: eventForm.name,
        event_date: eventForm.event_date,
        event_type: eventForm.event_type || null,
        expected_attendees: eventForm.expected_attendees || null,
        status: eventForm.status,
      })
      setEventForm({ name: '', event_date: '', event_type: '', expected_attendees: '', status: 'Planned' })
      setMessage('Event created.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not create event.')
    }
  }

  async function createTask(event) {
    event.preventDefault()
    if (!currentUser?.id) {
      setMessage('Please log in as an organizer before creating tasks.')
      return
    }

    if (taskForm.due_date && taskForm.due_date < tomorrowDate) {
      setMessage('Task due date must be tomorrow or later.')
      return
    }

    try {
      await apiPost('/tasks', {
        event_id: taskForm.event_id,
        title: taskForm.title,
        assigned_to: taskForm.assigned_to || null,
        created_by: currentUser.id,
        due_date: taskForm.due_date || null,
        status: taskForm.status,
      })
      setTaskForm({ event_id: '', title: '', assigned_to: '', due_date: '', status: 'Pending' })
      setMessage('Task created.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not create task.')
    }
  }

  async function updateTaskStatus(id, status) {
    try {
      await apiPatch(`/tasks/${id}/status`, { status, organizer_id: currentUser.id })
      setMessage('Task status updated.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not update task status.')
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Event planning</p>
        <h1>Events and Tasks</h1>
        <p>Create events, filter upcoming work, assign staff, and track task progress.</p>
      </div>

      {message && <p className="status-message">{message}</p>}

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header">
            <h2>Events</h2>
            <span>{events.length}</span>
          </div>
          <div className="filter-row">
            <select value={eventFilters.status} onChange={(e) => setEventFilters({ ...eventFilters, status: e.target.value })}>
              <option value="">All statuses</option>
              <option value="Planned">Planned</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <DateSelect value={eventFilters.date} onChange={(date) => setEventFilters({ ...eventFilters, date })} minDate={today} minYear={currentYear} maxYear={2035} />
          </div>
          <ul className="list data-list">
            {events.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                <span>{new Date(item.event_date).toLocaleDateString()} · {item.status} · {item.expected_attendees || 0} expected</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="page-panel">
          <div className="panel-header">
            <h2>Create Event</h2>
          </div>
          <form className="form compact-form" onSubmit={createEvent}>
            <input placeholder="Event name" value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} required />
            <DateSelect value={eventForm.event_date} onChange={(date) => setEventForm({ ...eventForm, event_date: date })} minDate={today} minYear={currentYear} maxYear={2035} required />
            <input placeholder="Event type" value={eventForm.event_type} onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })} />
            <input type="number" placeholder="Expected attendees" value={eventForm.expected_attendees} onChange={(e) => setEventForm({ ...eventForm, expected_attendees: e.target.value })} />
            <select value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}>
              <option value="Planned">Planned</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button type="submit">Create Event</button>
          </form>
        </section>
      </div>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header">
            <h2>Tasks</h2>
            <span>{tasks.length}</span>
          </div>
          <div className="filter-row">
            <select value={taskFilters.status} onChange={(e) => setTaskFilters({ ...taskFilters, status: e.target.value })}>
              <option value="">All statuses</option>
              {taskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={taskFilters.event_id} onChange={(e) => setTaskFilters({ ...taskFilters, event_id: e.target.value })}>
              <option value="">All events</option>
              {events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <ul className="list data-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <strong>{task.title}</strong>
                <span>Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'not set'} · {task.status}</span>
                <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)}>
                  {taskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </section>

        <section className="page-panel">
          <div className="panel-header">
            <h2>Create Task</h2>
          </div>
          <form className="form compact-form" onSubmit={createTask}>
            <select value={taskForm.event_id} onChange={(e) => setTaskForm({ ...taskForm, event_id: e.target.value })} required>
              <option value="">Choose event</option>
              {events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
            <select value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
              <option value="">Unassigned</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.full_name}</option>)}
            </select>
            <label>
              Due date
              <input
                type="date"
                min={tomorrowDate}
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
              />
            </label>
            <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
              {taskStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button type="submit">Create Task</button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default EventsTasks
