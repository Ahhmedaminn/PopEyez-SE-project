/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api'

const invitationStatuses = ['Draft', 'Sent', 'Opened', 'Cancelled']
const rsvpStatuses = ['Attending', 'Not Attending', 'Maybe', 'No Response']

const emptyGuestForm = {
  event_id: '',
  full_name: '',
  email: '',
  phone: '',
  dietary_preferences: '',
  special_requirements: '',
  notes: '',
}

function GuestManagement({ currentUser }) {
  const [events, setEvents] = useState([])
  const [guests, setGuests] = useState([])
  const [filters, setFilters] = useState({
    event_id: '',
    name: '',
    email: '',
    rsvp_status: '',
    dietary_preference: '',
  })
  const [guestForm, setGuestForm] = useState(emptyGuestForm)
  const [invitationForm, setInvitationForm] = useState({
    guest_id: '',
    status: 'Sent',
  })
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function loadEvents() {
    const eventsData = await apiGet(`/events?organizer_id=${currentUser.id}`)
    setEvents(eventsData)
    setGuestForm((current) => ({
      ...current,
      event_id: eventsData.some((event) => String(event.id) === current.event_id)
        ? current.event_id
        : String(eventsData[0]?.id || ''),
    }))
  }

  async function loadGuests() {
    const params = new URLSearchParams({ organizer_id: currentUser.id })
    Object.entries(filters).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim())
    })
    const guestData = await apiGet(`/guests/search?${params}`)
    setGuests(guestData)
  }

  useEffect(() => {
    loadEvents().catch((error) => {
      setMessage(error.message || 'Could not load organizer events.')
      setIsError(true)
    })
  }, [currentUser.id])

  useEffect(() => {
    loadGuests()
      .then(() => {
        setMessage('')
        setIsError(false)
      })
      .catch((error) => {
        setMessage(error.message || 'Could not load guest data.')
        setIsError(true)
      })
  }, [filters, currentUser.id])

  function updateGuestForm(field, value) {
    setGuestForm((current) => ({ ...current, [field]: value }))
  }

  async function createGuest(event) {
    event.preventDefault()
    setMessage('')

    if (!guestForm.event_id || !guestForm.full_name.trim()) {
      setMessage('Choose an event and enter the guest full name.')
      setIsError(true)
      return
    }

    try {
      await apiPost('/guests', {
        event_id: guestForm.event_id,
        full_name: guestForm.full_name.trim(),
        email: guestForm.email.trim() || null,
        phone: guestForm.phone.trim() || null,
        dietary_preferences: guestForm.dietary_preferences.trim() || null,
        special_requirements: guestForm.special_requirements.trim() || null,
        notes: guestForm.notes.trim() || null,
        organizer_id: currentUser.id,
      })
      setGuestForm((current) => ({ ...emptyGuestForm, event_id: current.event_id }))
      setMessage('Guest added successfully.')
      setIsError(false)
      await loadGuests()
    } catch (error) {
      setMessage(error.message || 'Could not add guest.')
      setIsError(true)
    }
  }

  async function sendInvitation(event) {
    event.preventDefault()
    setMessage('')

    const guest = guests.find((item) => String(item.id) === invitationForm.guest_id)
    if (!guest) {
      setMessage('Choose a guest before sending an invitation.')
      setIsError(true)
      return
    }

    try {
      const invitation = await apiPost('/invitations', {
        event_id: guest.event_id,
        guest_id: guest.id,
        sent_by: currentUser.id,
        channel: 'email',
        status: invitationForm.status,
        sent_at: invitationForm.status === 'Draft' ? null : new Date().toISOString(),
      })
      setInvitationForm({ guest_id: '', status: 'Sent' })
      if (invitation.email_delivery?.status === 'sent') {
        setMessage('Invitation created in the guest workspace and email sent to the guest.')
        setIsError(false)
      } else if (invitation.email_delivery?.status === 'saved') {
        setMessage('Invitation created in the guest workspace and email saved to backend/outbox because SMTP is not configured.')
        setIsError(false)
      } else if (invitation.email_delivery?.status === 'failed') {
        setMessage(`Invitation created in the workspace, but email failed: ${invitation.email_delivery.reason}`)
        setIsError(true)
      } else {
        setMessage('Digital invitation created successfully.')
        setIsError(false)
      }
      await loadGuests()
    } catch (error) {
      setMessage(error.message || 'Could not create invitation.')
      setIsError(true)
    }
  }

  async function updateInvitationStatus(id, status) {
    setMessage('')
    try {
      const invitation = await apiPatch(`/invitations/${id}/status`, {
        status,
        organizer_id: currentUser.id,
      })
      if (invitation.email_delivery?.status === 'sent') {
        setMessage('Invitation status updated and email sent to the guest.')
        setIsError(false)
      } else if (invitation.email_delivery?.status === 'saved') {
        setMessage('Invitation status updated and email saved to backend/outbox because SMTP is not configured.')
        setIsError(false)
      } else if (invitation.email_delivery?.status === 'failed') {
        setMessage(`Invitation status updated, but email failed: ${invitation.email_delivery.reason}`)
        setIsError(true)
      } else {
        setMessage('Invitation status updated.')
        setIsError(false)
      }
      await loadGuests()
    } catch (error) {
      setMessage(error.message || 'Could not update invitation status.')
      setIsError(true)
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Guest management</p>
        <h1>Guests, Invitations, RSVPs</h1>
        <p>Search owned event guest lists, review preferences, send invitations, and monitor responses.</p>
      </div>

      {message && <p className={isError ? 'error-text' : 'status-message'}>{message}</p>}

      <section className="page-panel">
        <div className="panel-header"><h2>Guest Filters</h2></div>
        <div className="filter-row">
          <select value={filters.event_id} onChange={(event) => setFilters({ ...filters, event_id: event.target.value })}>
            <option value="">All my events</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
          <input placeholder="Guest name" value={filters.name} onChange={(event) => setFilters({ ...filters, name: event.target.value })} />
          <input type="email" placeholder="Guest email" value={filters.email} onChange={(event) => setFilters({ ...filters, email: event.target.value })} />
          <select value={filters.rsvp_status} onChange={(event) => setFilters({ ...filters, rsvp_status: event.target.value })}>
            <option value="">All RSVP statuses</option>
            {rsvpStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input placeholder="Dietary preference" value={filters.dietary_preference} onChange={(event) => setFilters({ ...filters, dietary_preference: event.target.value })} />
        </div>
      </section>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Guest List</h2><span>{guests.length}</span></div>
          {guests.length === 0 ? (
            <p className="empty-state">No guests match these filters.</p>
          ) : (
            <ul className="list data-list guest-list">
              {guests.map((guest) => (
                <li key={guest.id}>
                  <strong>{guest.full_name}</strong>
                  <span><b>Event:</b> {guest.event_name}</span>
                  <span><b>Contact:</b> {guest.email || 'No email'} · {guest.phone || 'No phone'}</span>
                  <span><b>RSVP:</b> {guest.rsvp_status}</span>
                  <span><b>Dietary:</b> {guest.dietary_preferences || 'No dietary preference'}</span>
                  <span><b>Special requirements:</b> {guest.special_requirements || 'None'}</span>
                  <span><b>Notes:</b> {guest.notes || 'None'}</span>
                  <span>
                    <b>Invitation:</b> {guest.invitation_status || 'Not created'}
                    {guest.invitation_channel ? ` via ${guest.invitation_channel}` : ''}
                  </span>
                  {guest.invitation_id && (
                    <select
                      aria-label={`Invitation status for ${guest.full_name}`}
                      value={guest.invitation_status}
                      onChange={(event) => updateInvitationStatus(guest.invitation_id, event.target.value)}
                    >
                      {invitationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Add Guest</h2></div>
          <form className="form compact-form" onSubmit={createGuest}>
            <select value={guestForm.event_id} onChange={(event) => updateGuestForm('event_id', event.target.value)} required>
              <option value="">Choose one of my events</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
            <input placeholder="Full name" value={guestForm.full_name} onChange={(event) => updateGuestForm('full_name', event.target.value)} required />
            <input type="email" placeholder="Email" value={guestForm.email} onChange={(event) => updateGuestForm('email', event.target.value)} />
            <input placeholder="Phone" value={guestForm.phone} onChange={(event) => updateGuestForm('phone', event.target.value)} />
            <input placeholder="Dietary preferences" value={guestForm.dietary_preferences} onChange={(event) => updateGuestForm('dietary_preferences', event.target.value)} />
            <input placeholder="Special requirements" value={guestForm.special_requirements} onChange={(event) => updateGuestForm('special_requirements', event.target.value)} />
            <textarea placeholder="Notes" value={guestForm.notes} onChange={(event) => updateGuestForm('notes', event.target.value)} />
            <button type="submit">Add Guest</button>
          </form>
        </section>
      </div>

      <section className="page-panel">
        <div className="panel-header"><h2>Create Digital Invitation</h2></div>
        <form className="form invitation-form" onSubmit={sendInvitation}>
          <select value={invitationForm.guest_id} onChange={(event) => setInvitationForm({ ...invitationForm, guest_id: event.target.value })} required>
            <option value="">Choose guest</option>
            {guests.map((guest) => (
              <option key={guest.id} value={guest.id}>
                {guest.full_name} · {guest.event_name}{guest.invitation_id ? ' · invitation exists' : ''}
              </option>
            ))}
          </select>
          <p className="form-note">Sent invitations are delivered by email and also appear in the guest workspace.</p>
          <select value={invitationForm.status} onChange={(event) => setInvitationForm({ ...invitationForm, status: event.target.value })}>
            <option value="Draft">Save as Draft</option>
            <option value="Sent">Mark as Sent</option>
          </select>
          <button type="submit">Create Invitation</button>
        </form>
      </section>
    </div>
  )
}

export default GuestManagement
