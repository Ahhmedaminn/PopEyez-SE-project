import { useEffect, useState } from 'react'
import { apiGet } from '../api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'No date'
}

function StaffLayouts({ currentUser }) {
  const [layouts, setLayouts] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadLayouts() {
      try {
        const tasks = await apiGet(`/tasks/staff/${currentUser.id}`)
        const eventsById = new Map()

        tasks.forEach((task) => {
          eventsById.set(task.event_id, {
            id: task.event_id,
            name: task.event_name,
            event_date: task.event_date,
          })
        })

        const layoutGroups = await Promise.all(
          Array.from(eventsById.keys()).map((eventId) => apiGet(`/layouts/event/${eventId}`))
        )

        const sharedLayouts = layoutGroups
          .flat()
          .filter((layout) => layout.shared_with_team)
          .map((layout) => ({
            ...layout,
            event: eventsById.get(layout.event_id),
          }))

        setLayouts(sharedLayouts)
        setMessage('')
      } catch (err) {
        setMessage(err.message || 'Could not load shared layouts.')
      }
    }

    loadLayouts()
  }, [currentUser.id])

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Layout utilization</p>
        <h1>Shared Floor Plans</h1>
        <p>Setup information shared with the team by the organizer.</p>
      </div>

      {message && <p className="error-text">{message}</p>}

      <section className="page-panel">
        <div className="panel-header">
          <h2>Shared Layouts</h2>
          <span>{layouts.length}</span>
        </div>
        {layouts.length === 0 ? (
          <p className="empty-state">No shared layouts for your assigned events yet.</p>
        ) : (
          <ul className="list data-list">
            {layouts.map((layout) => (
              <li key={layout.id}>
                <strong>{layout.name}</strong>
                <span>{layout.event?.name || `Event #${layout.event_id}`} - {formatDate(layout.event?.event_date)}</span>
                <span>{layout.export_url || 'No export link saved'}</span>
                <span>{layout.layout_data ? JSON.stringify(layout.layout_data) : 'No setup notes saved'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default StaffLayouts
