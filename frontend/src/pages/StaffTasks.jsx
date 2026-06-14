/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiGet, apiPatch } from '../api'

const taskStatuses = ['Not Assigned', 'Pending', 'In Progress', 'Done', 'Overdue']

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'No date'
}

function StaffTasks({ currentUser }) {
  const [tasks, setTasks] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [message, setMessage] = useState('')

  async function loadTasks() {
    const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''
    const data = await apiGet(`/tasks/staff/${currentUser.id}${query}`)
    setTasks(data)
  }

  useEffect(() => {
    loadTasks()
      .then(() => setMessage(''))
      .catch((err) => setMessage(err.message || 'Could not load assigned tasks.'))
  }, [currentUser.id, statusFilter])

  async function updateTaskStatus(id, status) {
    setMessage('')

    try {
      await apiPatch(`/tasks/${id}/status`, { status })
      setMessage('Task status updated.')
      await loadTasks()
    } catch (err) {
      setMessage(err.message || 'Could not update task status.')
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Task management</p>
        <h1>My Assigned Tasks</h1>
        <p>Track operational tasks assigned to you and update completion progress.</p>
      </div>

      <section className="page-panel toolbar-panel">
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {taskStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
      </section>

      {message && <p className={message.toLowerCase().includes('could not') ? 'error-text' : 'status-message'}>{message}</p>}

      <section className="page-panel">
        <div className="panel-header">
          <h2>Tasks</h2>
          <span>{tasks.length}</span>
        </div>
        {tasks.length === 0 ? (
          <p className="empty-state">No tasks match this filter.</p>
        ) : (
          <ul className="list data-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <strong>{task.title}</strong>
                <span>{task.description || 'No description'}</span>
                <span>{task.category || 'No category'} - due {formatDate(task.due_date)} - {task.status}</span>
                <span>{task.event_name} - {formatDate(task.event_date)} - {task.event_status}</span>
                <select value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value)}>
                  {taskStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default StaffTasks
