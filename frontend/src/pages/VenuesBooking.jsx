/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { API_BASE_URL, apiGet, apiPatch, apiPost } from '../api'
import DateSelect from '../components/DateSelect'

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function pad(value) {
  return String(value).padStart(2, '0')
}

function getDateValue(value) {
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

function getDefaultMonth(availability) {
  const firstDate = availability.map((item) => getDateValue(item.available_date)).sort()[0]
  return firstDate ? firstDate.slice(0, 7) : '2026-06'
}

function parseCounterProposalAmount(value) {
  const match = String(value || '').replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/)
  return match ? Number(match[1]) : null
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return 'Not provided'
  return `${Number(value).toLocaleString()} EGP`
}

function getDocumentHref(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`
}

function AvailabilityCalendar({ availability, month, onMonthChange, onSelectDate }) {
  const [year, monthNumber] = month.split('-').map(Number)
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay()
  const daysInMonth = new Date(year, monthNumber, 0).getDate()
  const availabilityByDate = new Map(
    availability.map((item) => [getDateValue(item.available_date), item]),
  )
  const monthLabel = new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function moveMonth(offset) {
    const next = new Date(year, monthNumber - 1 + offset, 1)
    onMonthChange(`${next.getFullYear()}-${pad(next.getMonth() + 1)}`)
  }

  return (
    <div className="availability-calendar">
      <div className="calendar-toolbar">
        <button className="calendar-nav" onClick={() => moveMonth(-1)} type="button">Previous</button>
        <strong>{monthLabel}</strong>
        <button className="calendar-nav" onClick={() => moveMonth(1)} type="button">Next</button>
      </div>

      <div className="calendar-legend">
        <span><i className="legend-swatch available" /> Available</span>
        <span><i className="legend-swatch unavailable" /> Unavailable</span>
      </div>

      <div className="calendar-grid">
        {weekdayLabels.map((weekday) => <span className="calendar-weekday" key={weekday}>{weekday}</span>)}
        {Array.from({ length: firstWeekday }, (_, index) => <span className="calendar-blank" key={`blank-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1
          const date = `${year}-${pad(monthNumber)}-${pad(day)}`
          const record = availabilityByDate.get(date)
          const isAvailable = record?.is_available === true

          return (
            <button
              className={`calendar-day ${isAvailable ? 'available' : 'unavailable'}`}
              disabled={!isAvailable}
              key={date}
              onClick={() => onSelectDate(date)}
              title={record?.notes || (isAvailable ? 'Available for booking' : 'Not available for booking')}
              type="button"
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VenuesBooking({ currentUser }) {
  const [events, setEvents] = useState([])
  const [venues, setVenues] = useState([])
  const [availability, setAvailability] = useState([])
  const [requests, setRequests] = useState([])
  const [openCalendarVenueId, setOpenCalendarVenueId] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState('2026-06')
  const [bookingCalendarMonth, setBookingCalendarMonth] = useState('2026-06')
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState({ city: 'Cairo', minCapacity: '', maxPrice: '', date: '' })
  const [form, setForm] = useState({
    event_id: '',
    venue_id: '',
    requested_date: '',
    expected_attendees: '',
    special_requirements: '',
    proposed_price: '',
  })

  async function loadData() {
    const params = new URLSearchParams()
    if (filters.city) params.set('city', filters.city)
    if (filters.minCapacity) params.set('minCapacity', filters.minCapacity)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
    if (filters.date) params.set('date', filters.date)

    const [eventsData, venuesData, availabilityData, requestsData] = await Promise.all([
      apiGet(`/events?organizer_id=${currentUser.id}`),
      apiGet(`/venues/search?${params}`),
      apiGet('/venue-availability'),
      apiGet(`/booking-requests?organizer_id=${currentUser.id}`),
    ])

    setEvents(eventsData)
    setVenues(venuesData)
    setAvailability(availabilityData)
    setRequests(requestsData)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => setMessage('Could not load venue data.'))
  }, [filters])

  async function submitBooking(event) {
    event.preventDefault()
    if (!currentUser?.id) {
      setMessage('Please log in as an organizer before submitting booking requests.')
      return
    }

    if (!form.requested_date) {
      setMessage('Choose a green available date in the booking calendar.')
      return
    }

    try {
      await apiPost('/booking-requests', {
        event_id: form.event_id,
        venue_id: form.venue_id,
        organizer_id: currentUser.id,
        requested_date: form.requested_date,
        expected_attendees: form.expected_attendees || null,
        special_requirements: form.special_requirements || null,
        proposed_price: form.proposed_price || null,
        status: 'Pending',
      })
      setForm({ event_id: '', venue_id: '', requested_date: '', expected_attendees: '', special_requirements: '', proposed_price: '' })
      setMessage('Booking request submitted.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not submit booking request.')
    }
  }

  async function respondToCounter(requestId, response) {
    try {
      await apiPatch(`/booking-requests/${requestId}/organizer-counter-response`, {
        organizer_id: currentUser.id,
        response,
      })
      setMessage(response === 'Accepted' ? 'Counter-proposal accepted. Booking approved.' : 'Counter-proposal declined.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not respond to counter-proposal.')
    }
  }

  function toggleCalendar(venueId) {
    if (openCalendarVenueId === venueId) {
      setOpenCalendarVenueId(null)
      return
    }

    const venueAvailability = availability.filter((item) => item.venue_id === venueId)
    setOpenCalendarVenueId(venueId)
    setCalendarMonth(getDefaultMonth(venueAvailability))
  }

  function selectCalendarDate(venueId, date) {
    setForm((current) => ({
      ...current,
      venue_id: String(venueId),
      requested_date: date,
    }))
    setBookingCalendarMonth(date.slice(0, 7))
    setMessage(`Booking date selected: ${new Date(`${date}T00:00:00`).toLocaleDateString()}.`)
  }

  function selectBookingVenue(venueId) {
    const venueAvailability = availability.filter((item) => item.venue_id === Number(venueId))
    setForm((current) => ({ ...current, venue_id: venueId, requested_date: '' }))
    setBookingCalendarMonth(getDefaultMonth(venueAvailability))
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Venue search and booking</p>
        <h1>Venues and Booking Requests</h1>
        <p>Find available spaces, shortlist venues, and submit booking applications.</p>
      </div>
      {message && <p className="status-message">{message}</p>}

      <section className="page-panel">
        <div className="panel-header"><h2>Venue Filters</h2></div>
        <div className="filter-row">
          <input placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
          <input type="number" placeholder="Min capacity" value={filters.minCapacity} onChange={(e) => setFilters({ ...filters, minCapacity: e.target.value })} />
          <input type="number" placeholder="Max price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
          <DateSelect
            value={filters.date}
            onChange={(date) => {
              setFilters((current) => ({ ...current, date }))
            }}
            minYear={2026}
            maxYear={2035}
          />
          {filters.date && (
            <button
              className="secondary-button"
              onClick={() => {
                setFilters((current) => ({ ...current, date: '' }))
              }}
              type="button"
            >
              Clear date
            </button>
          )}
        </div>
        {filters.date && (
          <p className="filter-summary">
            Showing only venues available on {new Date(`${filters.date}T00:00:00`).toLocaleDateString()}.
          </p>
        )}
      </section>

      <section className="page-panel">
        <div className="panel-header"><h2>{filters.date ? 'Available Venue Listings' : 'Venue Listings'}</h2><span>{venues.length}</span></div>
        {venues.length === 0 ? (
          <p className="empty-state">No venues match the selected criteria and availability date.</p>
        ) : (
          <ul className="list data-list venue-list">
            {venues.map((venue) => (
              <li key={venue.id}>
                {venue.photo_url && (
                  <img
                    alt={`${venue.name} preview`}
                    className="venue-photo-preview"
                    src={getDocumentHref(venue.photo_url)}
                  />
                )}
                <strong>{venue.name}</strong>
                <span>
                  {venue.city} · Capacity {venue.capacity} · {Number(venue.price_override || venue.daily_price || 0).toLocaleString()} daily
                </span>
                <span>{venue.location} · {venue.amenities || 'No amenities listed'}</span>
                {venue.floor_plan_url && (
                  <span>
                    <b>Floor plan:</b> <a href={getDocumentHref(venue.floor_plan_url)} rel="noreferrer" target="_blank">Open floor plan</a>
                  </span>
                )}
                {filters.date && (
                  <span className="available-result">
                    Available on {new Date(`${filters.date}T00:00:00`).toLocaleDateString()}
                    {venue.availability_notes ? ` · ${venue.availability_notes}` : ''}
                  </span>
                )}
                <button
                  className="secondary-button availability-button"
                  onClick={() => toggleCalendar(venue.id)}
                  type="button"
                >
                  {openCalendarVenueId === venue.id ? 'Hide availability' : 'View availability'}
                </button>
                {openCalendarVenueId === venue.id && (
                  <AvailabilityCalendar
                    availability={availability.filter((item) => item.venue_id === venue.id)}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    onSelectDate={(date) => selectCalendarDate(venue.id, date)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Submit Booking Request</h2></div>
          <form className="form compact-form" onSubmit={submitBooking}>
            <select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })} required>
              <option value="">Choose event</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
            <select value={form.venue_id} onChange={(e) => selectBookingVenue(e.target.value)} required>
              <option value="">Choose venue</option>
              {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
            </select>
            {form.venue_id ? (
              <>
                <p className="booking-calendar-help">Choose a green date for this booking request.</p>
                <AvailabilityCalendar
                  availability={availability.filter((item) => item.venue_id === Number(form.venue_id))}
                  month={bookingCalendarMonth}
                  onMonthChange={setBookingCalendarMonth}
                  onSelectDate={(date) => {
                    setForm((current) => ({ ...current, requested_date: date }))
                    setMessage(`Booking date selected: ${new Date(`${date}T00:00:00`).toLocaleDateString()}.`)
                  }}
                />
                <p className="selected-date">
                  Booking date: {form.requested_date
                    ? new Date(`${form.requested_date}T00:00:00`).toLocaleDateString()
                    : 'Select a green date above'}
                </p>
              </>
            ) : (
              <p className="selected-date">Choose a venue to see its booking calendar.</p>
            )}
            <input type="number" placeholder="Expected attendees" value={form.expected_attendees} onChange={(e) => setForm({ ...form, expected_attendees: e.target.value })} />
            <input type="number" min="0" placeholder="Proposed price" value={form.proposed_price} onChange={(e) => setForm({ ...form, proposed_price: e.target.value })} />
            <textarea
              className="inline-textarea"
              placeholder="Special requirements for the venue owner"
              value={form.special_requirements}
              onChange={(e) => setForm({ ...form, special_requirements: e.target.value })}
            />
            <button disabled={!form.event_id || !form.venue_id || !form.requested_date} type="submit">
              Submit Booking Request
            </button>
          </form>
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Booking Status</h2><span>{requests.length}</span></div>
          <ul className="list data-list">
            {requests.map((request) => (
              <li key={request.id}>
                <strong>Request #{request.id}</strong>
                <span>{request.event_name} · {request.venue_name}</span>
                <span>
                  {new Date(`${request.requested_date.slice(0, 10)}T00:00:00`).toLocaleDateString()} · {request.status}
                </span>
                <span><b>Expected attendees:</b> {request.expected_attendees || 'Not provided'}</span>
                <span><b>Proposed price:</b> {formatMoney(request.proposed_price)}</span>
                {request.status === 'Approved' && request.counter_proposal && (
                  <span><b>Agreed price:</b> {formatMoney(parseCounterProposalAmount(request.counter_proposal) || request.proposed_price)}</span>
                )}
                <span><b>Special requirements:</b> {request.special_requirements || 'None provided.'}</span>
                {request.counter_proposal && request.status === 'Counter Proposal' && (
                  <span className="review-status warning-status">
                    Venue owner counter-proposal: {request.counter_proposal}
                  </span>
                )}
                {request.counter_proposal && request.status === 'Approved' && (
                  <span className="review-status good-status">
                    Counter-proposal accepted: {request.counter_proposal}
                  </span>
                )}
                {request.counter_proposal && request.status === 'Declined' && (
                  <span className="review-status bad-status">
                    Counter-proposal declined: {request.counter_proposal}
                  </span>
                )}
                {request.status === 'Counter Proposal' && (
                  <div className="inline-actions">
                    <button type="button" onClick={() => respondToCounter(request.id, 'Accepted')}>Accept Counter</button>
                    <button className="danger-button" type="button" onClick={() => respondToCounter(request.id, 'Declined')}>Decline Counter</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default VenuesBooking
