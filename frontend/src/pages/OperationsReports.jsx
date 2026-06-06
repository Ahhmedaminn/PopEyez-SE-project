/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api'

function OperationsReports({ currentUser }) {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('1')
  const [messages, setMessages] = useState([])
  const [checkins, setCheckins] = useState([])
  const [layouts, setLayouts] = useState([])
  const [feedback, setFeedback] = useState([])
  const [report, setReport] = useState(null)
  const [message, setMessage] = useState('')
  const [messageForm, setMessageForm] = useState({ body: '', subject: '' })
  const [layoutForm, setLayoutForm] = useState({ name: '', export_url: '' })

  async function loadData() {
    const [eventsData, messagesData, checkinsData, layoutsData, feedbackData, reportData] = await Promise.all([
      apiGet('/events'),
      apiGet(`/messages/event/${selectedEventId}`),
      apiGet(`/checkins/event/${selectedEventId}`),
      apiGet(`/layouts/event/${selectedEventId}`),
      apiGet(`/feedback/event/${selectedEventId}`),
      apiGet(`/reports/event/${selectedEventId}`),
    ])
    setEvents(eventsData)
    setMessages(messagesData)
    setCheckins(checkinsData)
    setLayouts(layoutsData)
    setFeedback(feedbackData)
    setReport(reportData)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => setMessage('Could not load operations data.'))
  }, [selectedEventId])

  async function sendMessage(event) {
    event.preventDefault()
    if (!currentUser?.id) {
      setMessage('Please log in as an organizer before sending messages.')
      return
    }

    try {
      await apiPost('/messages', {
        event_id: selectedEventId,
        sender_id: currentUser.id,
        subject: messageForm.subject || null,
        body: messageForm.body,
        message_type: 'day-of',
        status: 'Sent',
      })
      setMessageForm({ body: '', subject: '' })
      setMessage('Message sent.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not send message.')
    }
  }

  async function updateCheckin(id, status) {
    try {
      await apiPatch(`/checkins/${id}/status`, { status })
      setMessage('Check-in updated.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not update check-in.')
    }
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
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not save layout.')
    }
  }

  async function shareLayout(id, shared) {
    try {
      await apiPatch(`/layouts/${id}/share`, { shared_with_team: shared })
      setMessage('Layout sharing updated.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not update layout sharing.')
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Day-of and reporting</p>
        <h1>Operations, Layouts, Reports</h1>
        <p>Monitor check-ins, send live updates, save layouts, review feedback, and inspect reports.</p>
      </div>

      <div className="page-panel toolbar-panel">
        <label>
          Event
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
        </label>
      </div>
      {message && <p className="status-message">{message}</p>}

      {report && (
        <section className="stats-grid">
          <article><span>Total guests</span><strong>{report.total_guests}</strong></article>
          <article><span>Arrived</span><strong>{report.arrived_guests}</strong></article>
          <article><span>Not arrived</span><strong>{report.not_arrived_guests}</strong></article>
          <article><span>Budget difference</span><strong>{Number(report.budget_difference).toLocaleString()}</strong></article>
        </section>
      )}

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Send Live Message</h2></div>
          <form className="form compact-form" onSubmit={sendMessage}>
            <input placeholder="Subject" value={messageForm.subject} onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })} />
            <textarea placeholder="Message body" value={messageForm.body} onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })} required />
            <button type="submit">Send Message</button>
          </form>
          <ul className="list data-list">
            {messages.map((item) => (
              <li key={item.id}>
                <strong>{item.subject || 'Event message'}</strong>
                <span>{item.status} · {item.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Guest Check-ins</h2><span>{checkins.length}</span></div>
          <ul className="list data-list">
            {checkins.map((checkin) => (
              <li key={checkin.id}>
                <strong>Guest #{checkin.guest_id}</strong>
                <span>{checkin.status}</span>
                <select value={checkin.status} onChange={(e) => updateCheckin(checkin.id, e.target.value)}>
                  <option value="Not Arrived">Not Arrived</option>
                  <option value="Arrived">Arrived</option>
                </select>
              </li>
            ))}
          </ul>
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
          <div className="panel-header"><h2>Feedback Review</h2><span>{feedback.length}</span></div>
          <ul className="list data-list">
            {feedback.map((item) => (
              <li key={item.id}>
                <strong>{item.sentiment || 'Feedback'} · {item.overall_rating || '-'} / 5</strong>
                <span>{item.comments || 'No comments'}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default OperationsReports
