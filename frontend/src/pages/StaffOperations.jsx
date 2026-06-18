import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPatch } from '../api'

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'No date'
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : 'not set'
}

function StaffOperations({ currentUser }) {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [checkinStatusFilter, setCheckinStatusFilter] = useState('')
  const [checkins, setCheckins] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')

  const loadEventOperations = useCallback(async (eventId) => {
    if (!eventId) {
      setCheckins([])
      setDeliveries([])
      setMessages([])
      return
    }

    const [checkinsData, deliveriesData, messagesData] = await Promise.all([
      apiGet(`/checkins/event/${eventId}?staff_id=${currentUser.id}`),
      apiGet(`/deliveries/event/${eventId}?staff_id=${currentUser.id}`),
      apiGet(`/messages/event/${eventId}?staff_id=${currentUser.id}`),
    ])

    setCheckins(checkinsData)
    setDeliveries(deliveriesData)
    setMessages(messagesData)
  }, [currentUser.id])

  useEffect(() => {
    async function loadAssignedEvents() {
      try {
        const tasks = await apiGet(`/tasks/staff/${currentUser.id}`)
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

        const assignedEvents = Array.from(eventsById.values())
        setEvents(assignedEvents)

        if (assignedEvents.length > 0) {
          const firstEventId = String(assignedEvents[0].id)
          setSelectedEventId(firstEventId)
          await loadEventOperations(firstEventId)
        }

        setMessage('')
      } catch (err) {
        setMessage(err.message || 'Could not load staff operations.')
      }
    }

    loadAssignedEvents()
  }, [currentUser.id, loadEventOperations])

  async function changeSelectedEvent(eventId) {
    setSelectedEventId(eventId)
    setMessage('')

    try {
      await loadEventOperations(eventId)
    } catch (err) {
      setMessage(err.message || 'Could not load event operations.')
    }
  }

  async function updateCheckin(id, status) {
    setMessage('')

    try {
      await apiPatch(`/checkins/${id}/status`, { status, staff_id: currentUser.id })
      setMessage('Guest check-in updated.')
      await loadEventOperations(selectedEventId)
    } catch (err) {
      setMessage(err.message || 'Could not update guest check-in.')
    }
  }

  async function markDeliveryDelivered(id) {
    setMessage('')

    try {
      await apiPatch(`/deliveries/${id}/status`, { status: 'Delivered', staff_id: currentUser.id })
      setMessage('Vendor marked as arrived.')
      await loadEventOperations(selectedEventId)
    } catch (err) {
      setMessage(err.message || 'Could not update delivery status.')
    }
  }

  const arrivedGuests = checkins.filter((checkin) => checkin.status === 'Arrived').length
  const visibleCheckins = checkinStatusFilter
    ? checkins.filter((checkin) => checkin.status === checkinStatusFilter)
    : checkins

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Day-of logistics</p>
        <h1>Staff Operations</h1>
        <p>Guest check-ins, vendor arrival coordination, and live event messages.</p>
      </div>

      <section className="page-panel toolbar-panel">
        <div className="filter-row">
          <label>
            Event
            <select value={selectedEventId} onChange={(event) => changeSelectedEvent(event.target.value)}>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {formatDate(event.event_date)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Check-in status
            <select value={checkinStatusFilter} onChange={(event) => setCheckinStatusFilter(event.target.value)}>
              <option value="">All guests</option>
              <option value="Not Arrived">Not Arrived</option>
              <option value="Arrived">Arrived</option>
            </select>
          </label>
        </div>
      </section>

      {message && <p className={message.toLowerCase().includes('could not') ? 'error-text' : 'status-message'}>{message}</p>}

      <section className="stats-grid">
        <article><span>Total guests</span><strong>{checkins.length}</strong></article>
        <article><span>Arrived guests</span><strong>{arrivedGuests}</strong></article>
        <article><span>Vendor arrivals</span><strong>{deliveries.length}</strong></article>
        <article><span>Live messages</span><strong>{messages.length}</strong></article>
      </section>

      <div className="three-column">
        <section className="page-panel">
          <div className="panel-header">
            <h2>Guest Check-ins</h2>
            <span>{visibleCheckins.length}</span>
          </div>
          {visibleCheckins.length === 0 ? (
            <p className="empty-state">No guests match this check-in filter.</p>
          ) : (
            <ul className="list data-list">
              {visibleCheckins.map((checkin) => (
                <li key={checkin.id}>
                  <strong>{checkin.guest_name || `Guest #${checkin.guest_id}`}</strong>
                  <span>{checkin.status} - {checkin.guest_email || 'No email'} - {checkin.guest_phone || 'No phone'}</span>
                  <span>Dietary: {checkin.dietary_preferences || 'None'} - Requirements: {checkin.special_requirements || 'None'}</span>
                  <select value={checkin.status} onChange={(event) => updateCheckin(checkin.id, event.target.value)}>
                    <option value="Not Arrived">Not Arrived</option>
                    <option value="Arrived">Arrived</option>
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header">
            <h2>Vendor Arrivals</h2>
            <span>{deliveries.length}</span>
          </div>
          {deliveries.length === 0 ? (
            <p className="empty-state">No deliveries for this event.</p>
          ) : (
            <ul className="list data-list">
              {deliveries.map((delivery) => (
                <li key={delivery.id}>
                  <strong>{delivery.vendor_name || `Vendor #${delivery.vendor_id}`}</strong>
                  <span>{delivery.event_name || 'Event'} - {delivery.status}</span>
                  <span>{delivery.requested_items || 'No requested items'} - {delivery.quantity || 'No quantity'}</span>
                  <span>{delivery.event_location || 'No delivery location'} - scheduled {formatDateTime(delivery.scheduled_arrival)}</span>
                  <span>Arrived at: {formatDateTime(delivery.arrived_at)}</span>
                  <button type="button" disabled={delivery.status === 'Delivered'} onClick={() => markDeliveryDelivered(delivery.id)}>
                    Mark Arrived
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header">
            <h2>Live Messages</h2>
            <span>{messages.length}</span>
          </div>
          {messages.length === 0 ? (
            <p className="empty-state">No messages for this event.</p>
          ) : (
            <ul className="list data-list">
              {messages.map((item) => (
                <li key={item.id}>
                  <strong>{item.subject || 'Event message'}</strong>
                  <span>{item.status} - {item.body}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default StaffOperations
