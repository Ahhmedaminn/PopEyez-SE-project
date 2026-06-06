/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api'

function GuestManagement({ currentUser }) {
  const [events, setEvents] = useState([])
  const [guests, setGuests] = useState([])
  const [invitations, setInvitations] = useState([])
  const [rsvps, setRsvps] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('1')
  const [message, setMessage] = useState('')
  const [guestForm, setGuestForm] = useState({ full_name: '', email: '', dietary_preferences: '' })
  const [inviteGuestId, setInviteGuestId] = useState('')

  async function loadData() {
    const [eventsData, guestsData, invitationsData, rsvpsData] = await Promise.all([
      apiGet('/events'),
      apiGet(`/guests/event/${selectedEventId}`),
      apiGet(`/invitations/event/${selectedEventId}`),
      apiGet(`/rsvps/event/${selectedEventId}`),
    ])
    setEvents(eventsData)
    setGuests(guestsData)
    setInvitations(invitationsData)
    setRsvps(rsvpsData)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => setMessage('Could not load guest data.'))
  }, [selectedEventId])

  async function createGuest(event) {
    event.preventDefault()
    try {
      await apiPost('/guests', {
        event_id: selectedEventId,
        full_name: guestForm.full_name,
        email: guestForm.email || null,
        dietary_preferences: guestForm.dietary_preferences || null,
      })
      setGuestForm({ full_name: '', email: '', dietary_preferences: '' })
      setMessage('Guest added.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not add guest.')
    }
  }

  async function sendInvitation(event) {
    event.preventDefault()
    if (!currentUser?.id) {
      setMessage('Please log in as an organizer before sending invitations.')
      return
    }

    try {
      await apiPost('/invitations', {
        event_id: selectedEventId,
        guest_id: inviteGuestId,
        sent_by: currentUser.id,
        channel: 'email',
        status: 'Sent',
        sent_at: new Date().toISOString(),
      })
      setInviteGuestId('')
      setMessage('Invitation sent.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not send invitation.')
    }
  }

  async function updateInvitationStatus(id, status) {
    try {
      await apiPatch(`/invitations/${id}/status`, { status })
      setMessage('Invitation status updated.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not update invitation status.')
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Guest management</p>
        <h1>Guests, Invitations, RSVPs</h1>
        <p>Manage guest lists, dietary preferences, invitations, and RSVP status.</p>
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

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Guest List</h2><span>{guests.length}</span></div>
          <ul className="list data-list">
            {guests.map((guest) => (
              <li key={guest.id}>
                <strong>{guest.full_name}</strong>
                <span>{guest.email || 'No email'} · {guest.dietary_preferences || 'No dietary preference'}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="page-panel">
          <div className="panel-header"><h2>Add Guest</h2></div>
          <form className="form compact-form" onSubmit={createGuest}>
            <input placeholder="Full name" value={guestForm.full_name} onChange={(e) => setGuestForm({ ...guestForm, full_name: e.target.value })} required />
            <input type="email" placeholder="Email" value={guestForm.email} onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })} />
            <input placeholder="Dietary preferences" value={guestForm.dietary_preferences} onChange={(e) => setGuestForm({ ...guestForm, dietary_preferences: e.target.value })} />
            <button type="submit">Add Guest</button>
          </form>
        </section>
      </div>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Send Invitation</h2></div>
          <form className="form compact-form" onSubmit={sendInvitation}>
            <select value={inviteGuestId} onChange={(e) => setInviteGuestId(e.target.value)} required>
              <option value="">Choose guest</option>
              {guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.full_name}</option>)}
            </select>
            <button type="submit">Send Digital Invitation</button>
          </form>
          <ul className="list data-list">
            {invitations.map((invite) => (
              <li key={invite.id}>
                <strong>Invitation #{invite.id}</strong>
                <span>Guest #{invite.guest_id} · {invite.status}</span>
                <select value={invite.status} onChange={(e) => updateInvitationStatus(invite.id, e.target.value)}>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Opened">Opened</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </li>
            ))}
          </ul>
        </section>
        <section className="page-panel">
          <div className="panel-header"><h2>RSVPs</h2><span>{rsvps.length}</span></div>
          <ul className="list data-list">
            {rsvps.map((rsvp) => (
              <li key={rsvp.id}>
                <strong>Guest #{rsvp.guest_id}</strong>
                <span>{rsvp.status} · {rsvp.dietary_preferences || 'No preference'}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default GuestManagement
