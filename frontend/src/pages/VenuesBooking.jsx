/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'

function VenuesBooking({ currentUser }) {
  const [events, setEvents] = useState([])
  const [venues, setVenues] = useState([])
  const [availability, setAvailability] = useState([])
  const [requests, setRequests] = useState([])
  const [message, setMessage] = useState('')
  const [filters, setFilters] = useState({ city: 'Cairo', minCapacity: '', maxPrice: '', date: '' })
  const [form, setForm] = useState({ event_id: '', venue_id: '', requested_date: '', expected_attendees: '' })

  async function loadData() {
    const params = new URLSearchParams()
    if (filters.city) params.set('city', filters.city)
    if (filters.minCapacity) params.set('minCapacity', filters.minCapacity)
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)

    const [eventsData, venuesData, requestsData] = await Promise.all([
      apiGet('/events'),
      apiGet(`/venues/search?${params}`),
      apiGet('/booking-requests'),
    ])
    setEvents(eventsData)
    setVenues(venuesData)
    setRequests(requestsData)

    if (filters.date) {
      setAvailability(await apiGet(`/venue-availability/date/${filters.date}`))
    } else {
      setAvailability([])
    }
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

    try {
      await apiPost('/booking-requests', {
        event_id: form.event_id,
        venue_id: form.venue_id,
        organizer_id: currentUser.id,
        requested_date: form.requested_date,
        expected_attendees: form.expected_attendees || null,
        status: 'Pending',
      })
      setForm({ event_id: '', venue_id: '', requested_date: '', expected_attendees: '' })
      setMessage('Booking request submitted.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not submit booking request.')
    }
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
          <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </div>
      </section>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Venue Listings</h2><span>{venues.length}</span></div>
          <ul className="list data-list">
            {venues.map((venue) => (
              <li key={venue.id}>
                <strong>{venue.name}</strong>
                <span>{venue.city} · Capacity {venue.capacity} · {Number(venue.daily_price || 0).toLocaleString()} daily</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Available On Date</h2><span>{availability.length}</span></div>
          {availability.length === 0 ? <p className="empty-state">Choose a date to check availability.</p> : (
            <ul className="list data-list">
              {availability.map((venue) => (
                <li key={`${venue.id}-${venue.available_date}`}>
                  <strong>{venue.name}</strong>
                  <span>{new Date(venue.available_date).toLocaleDateString()} · {venue.price_override || venue.daily_price}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Submit Booking Request</h2></div>
          <form className="form compact-form" onSubmit={submitBooking}>
            <select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })} required>
              <option value="">Choose event</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
            <select value={form.venue_id} onChange={(e) => setForm({ ...form, venue_id: e.target.value })} required>
              <option value="">Choose venue</option>
              {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
            </select>
            <input type="date" value={form.requested_date} onChange={(e) => setForm({ ...form, requested_date: e.target.value })} required />
            <input type="number" placeholder="Expected attendees" value={form.expected_attendees} onChange={(e) => setForm({ ...form, expected_attendees: e.target.value })} />
            <button type="submit">Apply to Book</button>
          </form>
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Booking Status</h2><span>{requests.length}</span></div>
          <ul className="list data-list">
            {requests.map((request) => (
              <li key={request.id}>
                <strong>Request #{request.id}</strong>
                <span>Event #{request.event_id} · Venue #{request.venue_id} · {request.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default VenuesBooking
