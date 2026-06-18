import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api'

const rsvpStatuses = ['Attending', 'Not Attending', 'Maybe']
const sentiments = ['Positive', 'Neutral', 'Negative']
const ratingOptions = ['1', '2', '3', '4', '5']

function formatDate(value) {
  if (!value) return 'Date not set'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function formatDateTime(value) {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function formatTime(value) {
  if (!value) return 'Time not set'
  return String(value).slice(0, 5)
}

function isPastEvent(invitation) {
  if (!invitation.event_date) return false
  const today = new Date().toISOString().slice(0, 10)
  return String(invitation.event_date).slice(0, 10) < today
}

function getVenueText(invitation) {
  const venueParts = [
    invitation.venue_name,
    invitation.venue_location,
    invitation.venue_city,
  ].filter(Boolean)

  return venueParts.length > 0 ? venueParts.join(' - ') : 'Venue not assigned yet'
}

function getInvitationStatusClass(status) {
  if (status === 'Cancelled') return 'bad-status'
  if (status === 'Draft') return 'warning-status'
  return 'good-status'
}

function buildRsvpForms(invitations) {
  return invitations.reduce((forms, invitation) => {
    if (!invitation.rsvp_id) return forms

    forms[invitation.rsvp_id] = {
      status: invitation.rsvp_status === 'No Response' ? '' : invitation.rsvp_status,
      dietary_preferences: invitation.dietary_preferences || '',
      special_requirements: invitation.special_requirements || '',
    }
    return forms
  }, {})
}

function buildFeedbackForms(invitations) {
  return invitations.reduce((forms, invitation) => {
    forms[invitation.invitation_id] = {
      overall_rating: '',
      food_rating: '',
      venue_rating: '',
      organization_rating: '',
      sentiment: 'Positive',
      comments: '',
    }
    return forms
  }, {})
}

function getPageTitle(activePage) {
  if (activePage === 'guest-invitations') return 'Invitations'
  if (activePage === 'guest-rsvp') return 'RSVP'
  if (activePage === 'guest-messages') return 'Messages'
  if (activePage === 'guest-checkin') return 'Check-In'
  if (activePage === 'guest-feedback') return 'Feedback'
  return 'Guest Dashboard'
}

function GuestWorkspace({ currentUser, activePage = 'guest-dashboard' }) {
  const [invitations, setInvitations] = useState([])
  const [messages, setMessages] = useState([])
  const [rsvpForms, setRsvpForms] = useState({})
  const [feedbackForms, setFeedbackForms] = useState({})
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rsvpConfirmation, setRsvpConfirmation] = useState(null)

  const loadData = useCallback(async function loadData() {
    const [invitationData, messageData] = await Promise.all([
      apiGet(`/guest-workspace/${currentUser.id}/invitations`),
      apiGet(`/guest-workspace/${currentUser.id}/messages`),
    ])

    setInvitations(invitationData)
    setMessages(messageData)
    setRsvpForms(buildRsvpForms(invitationData))
    setFeedbackForms((current) => ({
      ...buildFeedbackForms(invitationData),
      ...current,
    }))
  }, [currentUser.id])

  useEffect(() => {
    let ignore = false

    async function loadPage() {
      setLoading(true)
      try {
        await loadData()
        if (!ignore) {
          setMessage('')
          setIsError(false)
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.message || 'Could not load guest workspace.')
          setIsError(true)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadPage()
    return () => {
      ignore = true
    }
  }, [loadData])

  const summary = useMemo(() => ({
    totalInvitations: invitations.length,
    upcomingInvitations: invitations.filter((invitation) => !isPastEvent(invitation)).length,
    attending: invitations.filter((invitation) => invitation.rsvp_status === 'Attending').length,
    maybe: invitations.filter((invitation) => invitation.rsvp_status === 'Maybe').length,
    notAttending: invitations.filter((invitation) => invitation.rsvp_status === 'Not Attending').length,
    noResponse: invitations.filter((invitation) => invitation.rsvp_status === 'No Response').length,
    unseenMessages: messages.filter((item) => item.status !== 'Seen').length,
    checkedIn: invitations.filter((invitation) => invitation.checkin_status === 'Arrived').length,
    feedbackSubmitted: invitations.filter((invitation) => invitation.feedback_id).length,
  }), [invitations, messages])

  function showSuccess(text) {
    setMessage(text)
    setIsError(false)
  }

  function showError(text) {
    setMessage(text)
    setIsError(true)
  }

  function updateRsvpForm(rsvpId, field, value) {
    setRsvpForms((current) => ({
      ...current,
      [rsvpId]: {
        ...(current[rsvpId] || {}),
        [field]: value,
      },
    }))
  }

  function updateFeedbackForm(invitationId, field, value) {
    setFeedbackForms((current) => ({
      ...current,
      [invitationId]: {
        ...(current[invitationId] || {}),
        [field]: value,
      },
    }))
  }

  async function submitRsvp(event, invitation) {
    event.preventDefault()

    if (invitation.invitation_status === 'Cancelled') {
      showError('This invitation is cancelled, so RSVP changes are not available.')
      return
    }

    if (isPastEvent(invitation)) {
      showError('RSVP changes are closed for past events.')
      return
    }

    const form = rsvpForms[invitation.rsvp_id] || {}
    if (!rsvpStatuses.includes(form.status)) {
      showError('Choose Attending, Not Attending, or Maybe before submitting.')
      return
    }

    try {
      await apiPatch(`/guest-workspace/rsvps/${invitation.rsvp_id}`, {
        user_id: currentUser.id,
        status: form.status,
        dietary_preferences: form.dietary_preferences || null,
        special_requirements: form.special_requirements || null,
      })
      await loadData()
      showSuccess('RSVP submitted successfully.')
      setRsvpConfirmation({
        eventName: invitation.event_name,
        status: form.status,
      })
    } catch (error) {
      showError(error.message || 'Could not update RSVP.')
    }
  }

  async function markMessageSeen(messageId) {
    try {
      await apiPatch(`/guest-workspace/messages/${messageId}/status`, {
        user_id: currentUser.id,
        status: 'Seen',
      })
      await loadData()
      showSuccess('Message marked as seen.')
    } catch (error) {
      showError(error.message || 'Could not update message status.')
    }
  }

  async function submitFeedback(event, invitation) {
    event.preventDefault()

    if (invitation.feedback_id) {
      showError('Feedback already submitted for this event.')
      return
    }

    const form = feedbackForms[invitation.invitation_id] || {}
    const requiredRatings = [
      form.overall_rating,
      form.food_rating,
      form.venue_rating,
      form.organization_rating,
    ]

    if (requiredRatings.some((rating) => !ratingOptions.includes(String(rating)))) {
      showError('All feedback ratings must be selected from 1 to 5.')
      return
    }

    if (!sentiments.includes(form.sentiment)) {
      showError('Choose a valid feedback sentiment.')
      return
    }

    try {
      await apiPost('/guest-workspace/feedback', {
        user_id: currentUser.id,
        event_id: invitation.event_id,
        guest_id: invitation.guest_id,
        overall_rating: form.overall_rating,
        food_rating: form.food_rating,
        venue_rating: form.venue_rating,
        organization_rating: form.organization_rating,
        sentiment: form.sentiment,
        comments: form.comments || null,
      })
      await loadData()
      showSuccess('Thank you. Feedback submitted successfully.')
    } catch (error) {
      showError(error.message || 'Could not submit feedback.')
    }
  }

  const hasInvitations = invitations.length > 0
  const rsvpInvitations = invitations.filter((invitation) => invitation.invitation_status !== 'Draft')
  const feedbackInvitations = invitations.filter((invitation) => {
    if (invitation.invitation_status === 'Cancelled') return false
    if (invitation.feedback_id) return true
    return isPastEvent(invitation) && invitation.checkin_status === 'Arrived'
  })

  function renderInvitationCards({ includeRsvp = false } = {}) {
    const items = includeRsvp ? rsvpInvitations : invitations

    if (items.length === 0) {
      return <p className="empty-state">No invitations are ready for this section.</p>
    }

    return (
      <ul className="list guest-invitation-list">
        {items.map((invitation) => {
          const form = rsvpForms[invitation.rsvp_id] || {}
          const isCancelled = invitation.invitation_status === 'Cancelled'
          const isPast = isPastEvent(invitation)
          const rsvpDisabled = isCancelled || isPast || !invitation.rsvp_id

          return (
            <li key={invitation.invitation_id} className={isCancelled ? 'cancelled-invitation' : ''}>
              <div className="guest-invitation-header">
                <div>
                  <strong>{invitation.event_name}</strong>
                  <span>{formatDate(invitation.event_date)} - {formatTime(invitation.start_time)} to {formatTime(invitation.end_time)}</span>
                </div>
                <span className={`review-status ${getInvitationStatusClass(invitation.invitation_status)}`}>
                  {invitation.invitation_status}
                </span>
              </div>

              <div className="guest-event-details">
                <span><b>Venue:</b> {getVenueText(invitation)}</span>
                <span><b>Dress code:</b> {invitation.dress_code || 'Not specified'}</span>
                <span><b>Agenda:</b> {invitation.agenda || 'Agenda not shared yet'}</span>
                <span><b>Organizer:</b> {invitation.organizer_name || 'Organizer'}{invitation.organizer_email ? ` - ${invitation.organizer_email}` : ''}</span>
                <span><b>Current RSVP:</b> {invitation.rsvp_status}</span>
              </div>

              {isCancelled && <p className="mvp-note">This invitation was cancelled. RSVP is closed.</p>}
              {isPast && !isCancelled && <p className="mvp-note">This event date has passed. RSVP changes are closed.</p>}

              {includeRsvp && (
                <form className="form guest-rsvp-form" onSubmit={(event) => submitRsvp(event, invitation)}>
                  <label>
                    RSVP status
                    <select
                      value={form.status || ''}
                      onChange={(event) => updateRsvpForm(invitation.rsvp_id, 'status', event.target.value)}
                      disabled={rsvpDisabled}
                      required
                    >
                      <option value="">Choose response</option>
                      {rsvpStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>

                  <label>
                    Dietary preferences
                    <input
                      value={form.dietary_preferences || ''}
                      onChange={(event) => updateRsvpForm(invitation.rsvp_id, 'dietary_preferences', event.target.value)}
                      placeholder="Vegetarian, no seafood, allergies..."
                      disabled={rsvpDisabled}
                    />
                  </label>

                  <label>
                    Special requirements
                    <textarea
                      value={form.special_requirements || ''}
                      onChange={(event) => updateRsvpForm(invitation.rsvp_id, 'special_requirements', event.target.value)}
                      placeholder="Accessibility, seating, arrival notes..."
                      disabled={rsvpDisabled}
                    />
                  </label>

                  <button type="submit" disabled={rsvpDisabled}>Submit RSVP</button>
                </form>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  function renderDashboard() {
    return (
      <>
        <section className="stats-grid">
          <article><span>Invitations</span><strong>{summary.totalInvitations}</strong></article>
          <article><span>Upcoming events</span><strong>{summary.upcomingInvitations}</strong></article>
          <article><span>Unseen messages</span><strong>{summary.unseenMessages}</strong></article>
          <article><span>Checked in</span><strong>{summary.checkedIn}</strong></article>
        </section>

        <div className="two-column">
          <section className="page-panel">
            <div className="panel-header">
              <h2>RSVP Summary</h2>
              <span>{summary.totalInvitations}</span>
            </div>
            <div className="guest-summary-grid">
              <span className="review-status good-status">Attending: {summary.attending}</span>
              <span className="review-status warning-status">Maybe: {summary.maybe}</span>
              <span className="review-status bad-status">Not Attending: {summary.notAttending}</span>
              <span className="review-status">No Response: {summary.noResponse}</span>
            </div>
          </section>

          <section className="page-panel">
            <div className="panel-header">
              <h2>Guest Progress</h2>
              <span>{summary.feedbackSubmitted}</span>
            </div>
            <ul className="list">
              {invitations.map((invitation) => (
                <li key={invitation.invitation_id}>
                  <strong>{invitation.event_name}</strong>
                  <span>RSVP: {invitation.rsvp_status}</span>
                  <span>Check-in: {invitation.checkin_status}</span>
                  <span>Feedback: {invitation.feedback_id ? 'Submitted' : 'Not submitted'}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </>
    )
  }

  function renderMessages() {
    return (
      <section className="page-panel">
        <div className="panel-header">
          <h2>Event Messages</h2>
          <span>{messages.length}</span>
        </div>
        {messages.length === 0 ? (
          <p className="empty-state">No event messages yet.</p>
        ) : (
          <ul className="list guest-invitation-list">
            {messages.map((item) => (
              <li key={item.id}>
                <div className="guest-invitation-header">
                  <div>
                    <strong>{item.event_name} - {item.subject || 'Event message'}</strong>
                    <span>{formatDateTime(item.created_at)}</span>
                  </div>
                  <span className={`review-status ${item.status === 'Seen' ? 'good-status' : 'warning-status'}`}>{item.status}</span>
                </div>
                <div className="guest-event-details">
                  <span><b>Type:</b> {item.message_type}</span>
                  <span><b>Message:</b> {item.body}</span>
                </div>
                <button type="button" disabled={item.status === 'Seen'} onClick={() => markMessageSeen(item.id)}>
                  Mark Seen
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  function renderCheckIn() {
    return (
      <section className="page-panel">
        <div className="panel-header">
          <h2>Check-In Information</h2>
          <span>{invitations.length}</span>
        </div>
        <ul className="list guest-invitation-list">
          {invitations.map((invitation) => (
            <li key={invitation.invitation_id}>
              <div className="guest-invitation-header">
                <div>
                  <strong>{invitation.event_name}</strong>
                  <span>{formatDate(invitation.event_date)} - {getVenueText(invitation)}</span>
                </div>
                <span className={`review-status ${invitation.checkin_status === 'Arrived' ? 'good-status' : 'warning-status'}`}>
                  {invitation.checkin_status}
                </span>
              </div>
              <p className={invitation.checkin_status === 'Arrived' ? 'status-message' : 'mvp-note'}>
                {invitation.checkin_status === 'Arrived'
                  ? 'You are checked in.'
                  : 'Please present your name or QR code to staff at the entrance.'}
              </p>
              <div className="guest-event-details">
                <span><b>Name confirmation:</b> {invitation.guest_name}</span>
                <span><b>QR placeholder:</b> {invitation.invitation_code || `GUEST-${invitation.guest_id}-EVENT-${invitation.event_id}`}</span>
                <span><b>Checked in at:</b> {formatDateTime(invitation.checked_in_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  function renderRatingSelect(invitation, field, label) {
    const form = feedbackForms[invitation.invitation_id] || {}

    return (
      <label>
        {label}
        <select
          value={form[field] || ''}
          onChange={(event) => updateFeedbackForm(invitation.invitation_id, field, event.target.value)}
          required
        >
          <option value="">Choose 1 to 5</option>
          {ratingOptions.map((rating) => <option key={rating} value={rating}>{rating}</option>)}
        </select>
      </label>
    )
  }

  function renderFeedback() {
    return (
      <section className="page-panel">
        <div className="panel-header">
          <h2>Post-Event Feedback</h2>
          <span>{feedbackInvitations.length}</span>
        </div>
        {feedbackInvitations.length === 0 ? (
          <p className="empty-state">No events are available for feedback yet.</p>
        ) : (
          <ul className="list guest-invitation-list">
            {feedbackInvitations.map((invitation) => {
              const form = feedbackForms[invitation.invitation_id] || {}

              return (
                <li key={invitation.invitation_id}>
                  <div className="guest-invitation-header">
                    <div>
                      <strong>{invitation.event_name}</strong>
                      <span>{formatDate(invitation.event_date)} - {getVenueText(invitation)}</span>
                    </div>
                    <span className={`review-status ${invitation.feedback_id ? 'good-status' : 'warning-status'}`}>
                      {invitation.feedback_id ? 'Submitted' : 'Requested'}
                    </span>
                  </div>

                  {invitation.feedback_id ? (
                    <div className="guest-event-details">
                      <span><b>Overall:</b> {invitation.overall_rating}/5</span>
                      <span><b>Food/beverages:</b> {invitation.food_rating || 'Not rated'}</span>
                      <span><b>Venue:</b> {invitation.venue_rating || 'Not rated'}</span>
                      <span><b>Organization:</b> {invitation.organization_rating || 'Not rated'}</span>
                      <span><b>Sentiment:</b> {invitation.sentiment || 'Not recorded'}</span>
                      <span><b>Comments:</b> {invitation.feedback_comments || 'No comments'}</span>
                      <span><b>Submitted:</b> {formatDateTime(invitation.feedback_submitted_at)}</span>
                      <p className="status-message">Feedback already submitted.</p>
                    </div>
                  ) : !isPastEvent(invitation) ? (
                    <p className="mvp-note">Feedback will be available after this event is finished.</p>
                  ) : invitation.checkin_status !== 'Arrived' ? (
                    <p className="mvp-note">Feedback is available after staff check you in at the event.</p>
                  ) : (
                    <form className="form guest-rsvp-form" onSubmit={(event) => submitFeedback(event, invitation)}>
                      {renderRatingSelect(invitation, 'overall_rating', 'Overall experience')}
                      {renderRatingSelect(invitation, 'food_rating', 'Food and beverages')}
                      {renderRatingSelect(invitation, 'venue_rating', 'Venue')}
                      {renderRatingSelect(invitation, 'organization_rating', 'Organization')}
                      <label>
                        Sentiment
                        <select value={form.sentiment || 'Positive'} onChange={(event) => updateFeedbackForm(invitation.invitation_id, 'sentiment', event.target.value)}>
                          {sentiments.map((sentiment) => <option key={sentiment} value={sentiment}>{sentiment}</option>)}
                        </select>
                      </label>
                      <label>
                        Comments
                        <textarea
                          value={form.comments || ''}
                          onChange={(event) => updateFeedbackForm(invitation.invitation_id, 'comments', event.target.value)}
                          placeholder="Share anything the organizer should know..."
                        />
                      </label>
                      <button type="submit">Submit Feedback</button>
                    </form>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    )
  }

  function renderActivePage() {
    if (activePage === 'guest-invitations') {
      return (
        <section className="page-panel">
          <div className="panel-header"><h2>Your Invitations</h2><span>{invitations.length}</span></div>
          {renderInvitationCards()}
        </section>
      )
    }

    if (activePage === 'guest-rsvp') {
      return (
        <section className="page-panel">
          <div className="panel-header"><h2>Update RSVP</h2><span>{rsvpInvitations.length}</span></div>
          {renderInvitationCards({ includeRsvp: true })}
        </section>
      )
    }

    if (activePage === 'guest-messages') return renderMessages()
    if (activePage === 'guest-checkin') return renderCheckIn()
    if (activePage === 'guest-feedback') return renderFeedback()
    return renderDashboard()
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Guest workspace</p>
        <h1>{getPageTitle(activePage)}</h1>
        <p>View your invitations, messages, check-in status, and post-event feedback requests.</p>
      </div>

      {message && <p className={isError ? 'error-text' : 'status-message'}>{message}</p>}

      {rsvpConfirmation && (
        <div className="popup-backdrop" role="presentation">
          <section className="popup-message" role="dialog" aria-modal="true" aria-labelledby="rsvp-confirmation-title">
            <p className="eyebrow">RSVP confirmation</p>
            <h2 id="rsvp-confirmation-title">Your RSVP was submitted</h2>
            <p>
              You responded <strong>{rsvpConfirmation.status}</strong> for{' '}
              <strong>{rsvpConfirmation.eventName}</strong>.
            </p>
            <button type="button" onClick={() => setRsvpConfirmation(null)}>OK</button>
          </section>
        </div>
      )}

      {loading ? (
        <section className="page-panel">
          <p className="empty-state">Loading your guest workspace...</p>
        </section>
      ) : !hasInvitations ? (
        <section className="page-panel notice-panel">
          <p className="eyebrow">No invitations yet</p>
          <h2>No guest invitations found for this account.</h2>
          <p className="empty-state">When an organizer sends you a digital invitation, it will appear here with event details, messages, check-in status, and feedback forms.</p>
        </section>
      ) : renderActivePage()}
    </div>
  )
}

export default GuestWorkspace
