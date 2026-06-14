/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api'

function chooseDayOfEvent(events) {
  const today = new Date().toISOString().slice(0, 10)
  return events.find((event) => event.event_date?.slice(0, 10) === today)
    || events.find((event) => event.status === 'Ongoing')
    || events.find((event) => event.event_date?.slice(0, 10) > today && event.status === 'Planned')
    || events[0]
}

function formatDate(value) {
  if (!value) return 'Not recorded'
  return new Date(value).toLocaleDateString()
}

function OperationsReports({ currentUser }) {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [operationSummary, setOperationSummary] = useState(null)
  const [operationGuests, setOperationGuests] = useState([])
  const [messages, setMessages] = useState([])
  const [layouts, setLayouts] = useState([])
  const [feedback, setFeedback] = useState([])
  const [report, setReport] = useState(null)
  const [reportError, setReportError] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [messageForm, setMessageForm] = useState({ body: '', subject: '' })
  const [layoutForm, setLayoutForm] = useState({ name: '', export_url: '' })

  async function loadData() {
    const eventsData = await apiGet(`/events?organizer_id=${currentUser.id}`)
    setEvents(eventsData)

    const selectedIsOwned = eventsData.some((event) => String(event.id) === selectedEventId)
    const preferredEvent = chooseDayOfEvent(eventsData)
    const eventId = selectedIsOwned ? selectedEventId : String(preferredEvent?.id || '')
    if (!eventId) {
      setOperationSummary(null)
      setOperationGuests([])
      setMessages([])
      setLayouts([])
      setFeedback([])
      setReport(null)
      setReportError('')
      return
    }

    if (eventId !== selectedEventId) setSelectedEventId(eventId)
    const ownerQuery = `organizer_id=${currentUser.id}`
    const [operationsData, layoutsData, feedbackData] = await Promise.all([
      apiGet(`/messages/operations/${eventId}?${ownerQuery}`),
      apiGet(`/layouts/event/${eventId}?${ownerQuery}`),
      apiGet(`/feedback/event/${eventId}?${ownerQuery}`),
    ])
    setOperationSummary(operationsData.summary)
    setOperationGuests(operationsData.guests)
    setMessages(operationsData.messages)
    setLayouts(layoutsData)
    setFeedback(feedbackData)

    try {
      const reportData = await apiGet(`/reports/event/${eventId}?${ownerQuery}`)
      setReport(reportData)
      setReportError('')
    } catch (error) {
      setReport(null)
      setReportError(error.message || 'Could not generate the event report.')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch((error) => {
      setMessage(error.message || 'Could not load operations data.')
      setIsError(true)
    })
  }, [selectedEventId])

  async function sendMessage(event, messageType = 'broadcast') {
    event.preventDefault()
    if (!currentUser?.id) {
      setMessage('Please log in as an organizer before sending messages.')
      return
    }

    if (!messageForm.body.trim()) {
      setMessage('Enter a message body before sending.')
      setIsError(true)
      return
    }

    try {
      const result = await apiPost(`/messages/${messageType}`, {
        event_id: selectedEventId,
        sender_id: currentUser.id,
        subject: messageForm.subject.trim() || null,
        body: messageForm.body.trim(),
      })
      setMessageForm({ body: '', subject: '' })
      setMessage(result.message)
      setIsError(false)
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not send message.')
      setIsError(true)
    }
  }

  async function sendFollowUp(event) {
    await sendMessage(event, 'follow-up')
  }

  async function createLayout(event) {
    event.preventDefault()
    if (!currentUser?.id) {
      setMessage('Please log in as an organizer before saving layouts.')
      return
    }

    try {
      await apiPost('/layouts', {
        event_id: selectedEventId,
        created_by: currentUser.id,
        name: layoutForm.name,
        export_url: layoutForm.export_url || null,
        layout_data: { note: 'MVP layout placeholder' },
        shared_with_team: false,
      })
      setLayoutForm({ name: '', export_url: '' })
      setMessage('Layout saved.')
      setIsError(false)
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not save layout.')
      setIsError(true)
    }
  }

  async function shareLayout(id, shared) {
    try {
      await apiPatch(`/layouts/${id}/share`, { shared_with_team: shared, organizer_id: currentUser.id })
      setMessage('Layout sharing updated.')
      setIsError(false)
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not update layout sharing.')
      setIsError(true)
    }
  }

  function exportReport() {
    if (!report) {
      setMessage('Generate a report before exporting it.')
      setIsError(true)
      return
    }

    try {
      const exportData = {
        generated_at: new Date().toISOString(),
        event: report.event,
        financial_summary: {
          planned_budget: report.total_planned_budget,
          actual_expenses: report.total_actual_expenses,
          budget_difference: report.budget_difference,
        },
        attendance_summary: {
          total_guests: report.total_guests,
          arrived_guests: report.arrived_guests,
          not_arrived_guests: report.not_arrived_guests,
        },
        feedback_summary: {
          average_overall_rating: report.average_overall_rating,
          ...report.feedback_summary,
        },
      }
      const fileName = (report.event.name || 'event-report')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const downloadUrl = URL.createObjectURL(
        new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      )
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${fileName || 'event-report'}-report.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)
      setMessage('Event report downloaded as JSON.')
      setIsError(false)
    } catch {
      setMessage('Could not export the event report.')
      setIsError(true)
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Day-of and reporting</p>
        <h1>Day-Of Operations</h1>
        <p>Monitor arrivals and communications, then review layouts, feedback, and the event report.</p>
      </div>

      <div className="page-panel toolbar-panel">
        <label>
          Event
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
        </label>
      </div>
      {message && <p className={isError ? 'error-text' : 'status-message'}>{message}</p>}

      {operationSummary && (
        <section className="stats-grid">
          <article><span>Total guests</span><strong>{operationSummary.total_guests}</strong></article>
          <article><span>Arrived guests</span><strong>{operationSummary.arrived_guests}</strong></article>
          <article><span>Not arrived</span><strong>{operationSummary.not_arrived_guests}</strong></article>
          <article><span>Sent messages</span><strong>{operationSummary.sent_messages}</strong></article>
          <article><span>Received messages</span><strong>{operationSummary.received_messages}</strong></article>
          <article><span>Seen messages</span><strong>{operationSummary.seen_messages}</strong></article>
          <article><span>Not seen</span><strong>{operationSummary.unseen_messages}</strong></article>
        </section>
      )}

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Live Day-Of Communication</h2></div>
          <form className="form compact-form" onSubmit={sendMessage}>
            <input placeholder="Subject" value={messageForm.subject} onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })} />
            <textarea placeholder="Message body" value={messageForm.body} onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })} required />
            <button type="submit">Send to All Guests</button>
            <button type="button" className="secondary-button" onClick={sendFollowUp}>
              Send Follow-Up to Unseen Guests
            </button>
          </form>
          <ul className="list data-list">
            {messages.map((item) => (
              <li key={item.id}>
                <strong>{item.guest_name || 'Event audience'} · {item.subject || 'Event message'}</strong>
                <span>{item.message_type === 'follow-up' ? 'Follow-up' : 'Initial'} · {item.status}</span>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Guest Operations Monitor</h2><span>{operationGuests.length}</span></div>
          <p className="mvp-note">Check-in status is monitored here. Assigned staff update arrivals from Staff Operations.</p>
          {operationGuests.length === 0 ? (
            <p className="empty-state">No guests for this event.</p>
          ) : (
            <ul className="list data-list">
              {operationGuests.map((guest) => (
                <li key={guest.id}>
                  <strong>{guest.full_name}</strong>
                  <span><b>RSVP:</b> {guest.rsvp_status}</span>
                  <span><b>Check-in:</b> {guest.checkin_status}</span>
                  <span><b>Latest message:</b> {guest.message_status || 'No message sent'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Layout Manager MVP</h2><span>{layouts.length}</span></div>
          <p className="mvp-note">This MVP stores layout names, layout JSON/notes, sharing status, and export URL. Full drag-and-drop design is planned as future work.</p>
          <form className="form compact-form" onSubmit={createLayout}>
            <input placeholder="Layout name" value={layoutForm.name} onChange={(e) => setLayoutForm({ ...layoutForm, name: e.target.value })} required />
            <input placeholder="Export URL placeholder" value={layoutForm.export_url} onChange={(e) => setLayoutForm({ ...layoutForm, export_url: e.target.value })} />
            <button type="submit">Save Layout</button>
          </form>
          <ul className="list data-list">
            {layouts.map((layout) => (
              <li key={layout.id}>
                <strong>{layout.name}</strong>
                <span>{layout.shared_with_team ? 'Shared with team' : 'Not shared'} · {layout.export_url || 'No export link'}</span>
                <button type="button" onClick={() => shareLayout(layout.id, !layout.shared_with_team)}>
                  {layout.shared_with_team ? 'Unshare' : 'Share'}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Post-Event Feedback</h2><span>{feedback.length}</span></div>
          {feedback.length === 0 ? (
            <p className="empty-state">No feedback submitted yet.</p>
          ) : (
            <ul className="list data-list">
              {feedback.map((item) => (
                <li key={item.id}>
                  <strong>{item.guest_name || 'Anonymous guest'} · {item.sentiment || 'No sentiment'}</strong>
                  <span><b>Overall:</b> {item.overall_rating ?? 'Not rated'} / 5</span>
                  <span>
                    <b>Food:</b> {item.food_rating ?? 'Not rated'} · <b>Venue:</b> {item.venue_rating ?? 'Not rated'} · <b>Organization:</b> {item.organization_rating ?? 'Not rated'}
                  </span>
                  <span><b>Comments:</b> {item.comments || 'No comments'}</span>
                  <span><b>Submitted:</b> {formatDate(item.submitted_at || item.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {reportError && (
        <section className="page-panel error-panel">
          <p className="error-text">{reportError}</p>
        </section>
      )}

      {report && (
        <section className="page-panel">
          <div className="panel-header">
            <h2>Comprehensive Event Report</h2>
            <button type="button" onClick={exportReport}>Export JSON</button>
          </div>
          <p className="selected-event-summary">
            <strong>{report.event.name}</strong> · {formatDate(report.event.event_date)} · {report.event.status}
          </p>
          <div className="stats-grid">
            <article><span>Planned budget</span><strong>{Number(report.total_planned_budget).toLocaleString()}</strong></article>
            <article><span>Actual expenses</span><strong>{Number(report.total_actual_expenses).toLocaleString()}</strong></article>
            <article><span>Budget difference</span><strong>{Number(report.budget_difference).toLocaleString()}</strong></article>
            <article><span>Total guests</span><strong>{report.total_guests}</strong></article>
            <article><span>Arrived guests</span><strong>{report.arrived_guests}</strong></article>
            <article><span>Not arrived</span><strong>{report.not_arrived_guests}</strong></article>
            <article><span>Average rating</span><strong>{report.average_overall_rating ?? 'No rating'}</strong></article>
            <article>
              <span>Feedback outcome</span>
              <strong>{report.feedback_summary?.positive ?? 0} positive</strong>
              <small>
                {report.feedback_summary?.neutral ?? 0} neutral · {report.feedback_summary?.negative ?? 0} negative
              </small>
            </article>
          </div>
        </section>
      )}
    </div>
  )
}

export default OperationsReports
