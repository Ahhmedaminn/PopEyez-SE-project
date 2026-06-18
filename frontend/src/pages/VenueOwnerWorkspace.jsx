import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost, apiPostForm, apiPut, apiPutForm } from '../api'

const emptyVenue = {
  name: '',
  description: '',
  location: '',
  city: '',
  capacity: '',
  dimensions_sqm: '',
  amenities: '',
  daily_price: '',
  photo_url: '',
  floor_plan_url: '',
  photo_file: null,
  floor_plan_file: null,
}

const emptyAvailability = {
  venue_id: '',
  available_date: '',
  is_available: true,
  price_override: '',
  notes: '',
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function pad(value) {
  return String(value).padStart(2, '0')
}

function getDateValue(value) {
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

function getCurrentDateValue() {
  return new Date().toISOString().slice(0, 10)
}

function getCurrentMonthValue() {
  return getCurrentDateValue().slice(0, 7)
}

function formatDate(value) {
  if (!value) return 'Not scheduled'
  const text = String(value).slice(0, 10)
  const date = new Date(`${text}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return 'No price set'
  return `${Number(value).toLocaleString()} EGP`
}

function getDocumentHref(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`
}

function parseCounterProposalAmount(value) {
  const match = String(value || '').replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/)
  return match ? Number(match[1]) : null
}

function getRequestRevenue(request) {
  const counterAmount = parseCounterProposalAmount(request.counter_proposal)
  if (counterAmount !== null) return counterAmount
  return Number(request.proposed_price || 0)
}

function filterByBookingFields(request, filters) {
  const requestDate = String(request.requested_date || '').slice(0, 10)

  if (filters.venue_id && String(request.venue_id) !== String(filters.venue_id)) return false
  if (filters.status && request.status !== filters.status) return false
  if (filters.from && requestDate < filters.from) return false
  if (filters.to && requestDate > filters.to) return false

  return true
}

function downloadTextFile(fileName, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function escapePdfText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function wrapPdfLine(value, maxLength = 86) {
  const words = String(value ?? '').split(/\s+/)
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = nextLine
    }
  })

  if (currentLine) lines.push(currentLine)
  return lines.length ? lines : ['']
}

function buildPdfDocument(lines) {
  const pageWidth = 612
  const pageHeight = 792
  const marginX = 48
  const startY = 740
  const lineHeight = 16
  const maxLinesPerPage = Math.floor((startY - 52) / lineHeight)
  const pages = []

  for (let index = 0; index < lines.length; index += maxLinesPerPage) {
    pages.push(lines.slice(index, index + maxLinesPerPage))
  }

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  ]

  pages.forEach((pageLines, pageIndex) => {
    const pageObjectId = 3 + pageIndex * 2
    const contentObjectId = pageObjectId + 1
    const textCommands = [
      'BT',
      '/F1 11 Tf',
      '14 TL',
      `${marginX} ${startY} Td`,
      ...pageLines.map((line, lineIndex) => (
        `${lineIndex === 0 ? '' : 'T* '}(${escapePdfText(line)}) Tj`
      )),
      'ET',
    ].join('\n')

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    )
    objects.push(`<< /Length ${textCommands.length} >>\nstream\n${textCommands}\nendstream`)
  })

  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return pdf
}

function getStatusClass(status) {
  if (['Active', 'Approved'].includes(status)) return 'good-status'
  if (['Pending', 'Counter Proposal'].includes(status)) return 'warning-status'
  return 'bad-status'
}

function VenuePhotoPreview({ src, name }) {
  const href = getDocumentHref(src)

  if (!src) {
    return (
      <div className="venue-photo-placeholder">
        No venue photo
      </div>
    )
  }

  return (
    <img
      alt={`${name || 'Venue'} preview`}
      className="venue-photo-preview"
      src={href}
      onError={(event) => {
        event.currentTarget.style.display = 'none'
      }}
    />
  )
}

function OwnerAvailabilityCalendar({ availability, month, onMonthChange, onSelectDate, selectedDate }) {
  const [year, monthNumber] = month.split('-').map(Number)
  const currentDate = getCurrentDateValue()
  const currentMonth = getCurrentMonthValue()
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay()
  const daysInMonth = new Date(year, monthNumber, 0).getDate()
  const availabilityByDate = new Map(
    availability.map((item) => [getDateValue(item.available_date), item])
  )
  const monthLabel = new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function moveMonth(offset) {
    const next = new Date(year, monthNumber - 1 + offset, 1)
    const nextMonth = `${next.getFullYear()}-${pad(next.getMonth() + 1)}`
    if (nextMonth >= currentMonth) {
      onMonthChange(nextMonth)
    }
  }

  return (
    <div className="availability-calendar owner-availability-calendar">
      <div className="calendar-toolbar">
        <button className="calendar-nav" disabled={month <= currentMonth} onClick={() => moveMonth(-1)} type="button">Previous</button>
        <strong>{monthLabel}</strong>
        <button className="calendar-nav" onClick={() => moveMonth(1)} type="button">Next</button>
      </div>

      <div className="calendar-legend">
        <span><i className="legend-swatch available" /> Available</span>
        <span><i className="legend-swatch unavailable" /> Unavailable</span>
        <span><i className="legend-swatch unset" /> Not set yet</span>
      </div>

      <div className="calendar-grid">
        {weekdayLabels.map((weekday) => <span className="calendar-weekday" key={weekday}>{weekday}</span>)}
        {Array.from({ length: firstWeekday }, (_, index) => <span className="calendar-blank" key={`blank-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1
          const date = `${year}-${pad(monthNumber)}-${pad(day)}`
          if (date < currentDate) {
            return <span className="calendar-blank" key={date} />
          }

          const record = availabilityByDate.get(date)
          const isAvailable = record?.is_available === true
          const stateClass = record ? (isAvailable ? 'available' : 'unavailable') : 'unset'
          const selected = selectedDate === date

          return (
            <button
              className={`calendar-day ${stateClass} ${selected ? 'selected' : ''}`}
              key={date}
              onClick={() => onSelectDate(date, record)}
              title={record?.notes || (record ? 'Unavailable for booking' : 'No availability record yet')}
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

function VenueOwnerWorkspace({ currentUser, activePage = 'dashboard', onUserUpdated }) {
  const [profile, setProfile] = useState({
    full_name: currentUser.full_name || '',
    phone: currentUser.phone || '',
    company_name: currentUser.company_name || '',
  })
  const [venues, setVenues] = useState([])
  const [availability, setAvailability] = useState([])
  const [requests, setRequests] = useState([])
  const [venueForm, setVenueForm] = useState(emptyVenue)
  const [editingVenueId, setEditingVenueId] = useState(null)
  const [availabilityForm, setAvailabilityForm] = useState(emptyAvailability)
  const [openAvailabilityVenueId, setOpenAvailabilityVenueId] = useState(null)
  const [listingCalendarMonth, setListingCalendarMonth] = useState(new Date().toISOString().slice(0, 7))
  const [counterProposals, setCounterProposals] = useState({})
  const [requestFilters, setRequestFilters] = useState({ venue_id: '', status: '', from: '', to: '' })
  const [confirmedFilters, setConfirmedFilters] = useState({ venue_id: '', status: 'Approved', from: '', to: '' })
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async function loadData() {
    const [userData, venueData, availabilityData, requestData] = await Promise.all([
      apiGet(`/users/${currentUser.id}`),
      apiGet(`/venues/owner/${currentUser.id}`),
      apiGet(`/venue-availability/owner/${currentUser.id}`),
      apiGet(`/booking-requests/venue-owner/${currentUser.id}`),
    ])

    setProfile({
      full_name: userData.full_name || '',
      phone: userData.phone || '',
      company_name: userData.company_name || '',
    })
    setVenues(venueData)
    setAvailability(availabilityData)
    setRequests(requestData)
  }, [currentUser.id])

  useEffect(() => {
    let ignore = false

    async function loadWorkspace() {
      setLoading(true)
      try {
        await loadData()
        if (!ignore) {
          setMessage('')
          setIsError(false)
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.message || 'Could not load venue owner workspace.')
          setIsError(true)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadWorkspace()
    return () => {
      ignore = true
    }
  }, [loadData])

  const confirmedBookings = useMemo(() => (
    requests.filter((request) => request.status === 'Approved')
  ), [requests])

  const filteredRequests = useMemo(() => (
    requests.filter((request) => filterByBookingFields(request, requestFilters))
  ), [requestFilters, requests])

  const filteredConfirmedBookings = useMemo(() => (
    confirmedBookings.filter((request) => filterByBookingFields(request, confirmedFilters))
  ), [confirmedBookings, confirmedFilters])

  const upcomingConfirmedBookings = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return confirmedBookings.filter((request) => String(request.requested_date).slice(0, 10) >= today)
  }, [confirmedBookings])

  const venuePerformance = useMemo(() => (
    venues.map((venue) => {
      const venueRequests = requests.filter((request) => String(request.venue_id) === String(venue.id))
      const approved = venueRequests.filter((request) => request.status === 'Approved')
      const revenue = approved.reduce((total, request) => total + getRequestRevenue(request), 0)

      return {
        id: venue.id,
        name: venue.name,
        totalRequests: venueRequests.length,
        approvedBookings: approved.length,
        bookingRate: venueRequests.length === 0 ? 0 : Math.round((approved.length / venueRequests.length) * 100),
        revenue,
      }
    })
  ), [requests, venues])

  const bookingHistory = useMemo(() => (
    [...requests].sort((first, second) => {
      const firstDate = String(first.requested_date || '').slice(0, 10)
      const secondDate = String(second.requested_date || '').slice(0, 10)

      if (firstDate !== secondDate) return firstDate.localeCompare(secondDate)
      return Number(first.id) - Number(second.id)
    })
  ), [requests])

  const summary = useMemo(() => ({
    totalVenues: venues.length,
    activeVenues: venues.filter((venue) => venue.status === 'Active').length,
    inactiveVenues: venues.filter((venue) => venue.status === 'Inactive').length,
    pendingRequests: requests.filter((request) => request.status === 'Pending').length,
    approvedBookings: confirmedBookings.length,
    declinedBookings: requests.filter((request) => request.status === 'Declined').length,
    upcomingConfirmed: upcomingConfirmedBookings.length,
    totalRevenue: confirmedBookings.reduce((total, request) => total + getRequestRevenue(request), 0),
  }), [confirmedBookings, requests, upcomingConfirmedBookings.length, venues])

  const pageInfo = {
    dashboard: {
      eyebrow: 'Venue owner overview',
      title: profile.company_name || 'Venue Owner Workspace',
      description: 'Monitor listings, availability, booking requests, and confirmed bookings.',
    },
    'venue-owner-profile': {
      eyebrow: 'Account setup',
      title: 'Owner Profile',
      description: 'Update owner name, contact information, and company name.',
    },
    'venue-listings': {
      eyebrow: 'Venue listing management',
      title: 'Venue Listings',
      description: 'Create, edit, and deactivate spaces that organizers can request.',
    },
    'venue-booking-requests': {
      eyebrow: 'Booking request management',
      title: 'Booking Requests',
      description: 'Approve, decline, or counter organizer requests for your spaces.',
    },
    'venue-confirmed-bookings': {
      eyebrow: 'Booking overview',
      title: 'Confirmed Bookings',
      description: 'Review approved bookings across your venues and filter by venue, date, or status.',
    },
    'venue-performance': {
      eyebrow: 'Performance and reporting',
      title: 'Venue Performance',
      description: 'Track booking rate, approved revenue, and export MVP reports.',
    },
  }[activePage] || {
    eyebrow: 'Venue owner overview',
    title: profile.company_name || 'Venue Owner Workspace',
    description: 'Monitor listings, availability, booking requests, and confirmed bookings.',
  }

  function showSuccess(text) {
    setMessage(text)
    setIsError(false)
  }

  function showError(text) {
    setMessage(text)
    setIsError(true)
  }

  async function saveProfile(event) {
    event.preventDefault()

    if (!profile.full_name.trim() || !profile.phone.trim() || !profile.company_name.trim()) {
      showError('Owner name, contact phone, and company name are required.')
      return
    }

    try {
      const updatedUser = await apiPut(`/users/${currentUser.id}`, {
        actor_id: currentUser.id,
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        company_name: profile.company_name.trim(),
      })
      onUserUpdated?.(updatedUser)
      await loadData()
      showSuccess('Venue owner profile updated.')
    } catch (error) {
      showError(error.message || 'Could not update profile.')
    }
  }

  function resetVenueForm() {
    setVenueForm(emptyVenue)
    setEditingVenueId(null)
  }

  function editVenue(venue) {
    setEditingVenueId(venue.id)
    setVenueForm({
      name: venue.name || '',
      description: venue.description || '',
      location: venue.location || '',
      city: venue.city || '',
      capacity: venue.capacity || '',
      dimensions_sqm: venue.dimensions_sqm || '',
      amenities: venue.amenities || '',
      daily_price: venue.daily_price || '',
      photo_url: venue.photo_url || '',
      floor_plan_url: venue.floor_plan_url || '',
      photo_file: null,
      floor_plan_file: null,
    })
  }

  async function saveVenue(event) {
    event.preventDefault()

    if (
      !venueForm.name.trim()
      || !venueForm.location.trim()
      || !venueForm.city.trim()
      || Number(venueForm.capacity) <= 0
    ) {
      showError('Venue name, location, city, and a positive capacity are required.')
      return
    }

    const formData = new FormData()
    formData.append('owner_id', currentUser.id)
    formData.append('name', venueForm.name.trim())
    formData.append('description', venueForm.description.trim())
    formData.append('location', venueForm.location.trim())
    formData.append('city', venueForm.city.trim())
    formData.append('capacity', venueForm.capacity)
    formData.append('dimensions_sqm', venueForm.dimensions_sqm || '')
    formData.append('amenities', venueForm.amenities.trim())
    formData.append('daily_price', venueForm.daily_price || '')
    formData.append('photo_url', venueForm.photo_url || '')
    formData.append('floor_plan_url', venueForm.floor_plan_url || '')

    if (venueForm.photo_file) {
      formData.append('venue_photo', venueForm.photo_file)
    }

    if (venueForm.floor_plan_file) {
      formData.append('floor_plan', venueForm.floor_plan_file)
    }

    try {
      if (editingVenueId) {
        await apiPutForm(`/venues/${editingVenueId}`, formData)
        showSuccess('Venue listing updated.')
      } else {
        await apiPostForm('/venues', formData)
        showSuccess('Venue listing created.')
      }
      resetVenueForm()
      await loadData()
    } catch (error) {
      showError(error.message || 'Could not save venue listing.')
    }
  }

  async function changeVenueStatus(venueId, status) {
    try {
      await apiPatch(`/venues/${venueId}/status`, {
        owner_id: currentUser.id,
        status,
      })
      await loadData()
      showSuccess(status === 'Inactive' ? 'Venue listing deactivated.' : 'Venue listing reactivated.')
    } catch (error) {
      showError(error.message || 'Could not update venue status.')
    }
  }

  function toggleListingCalendar(venueId) {
    if (openAvailabilityVenueId === venueId) {
      setOpenAvailabilityVenueId(null)
      setAvailabilityForm(emptyAvailability)
      return
    }

    setOpenAvailabilityVenueId(venueId)
    setListingCalendarMonth(getCurrentMonthValue())
    setAvailabilityForm({ ...emptyAvailability, venue_id: String(venueId) })
  }

  function selectListingCalendarDate(venueId, date, record) {
    setAvailabilityForm({
      venue_id: String(venueId),
      available_date: date,
      is_available: record ? record.is_available === true : true,
      price_override: record?.price_override || '',
      notes: record?.notes || '',
    })
  }

  async function removeVenue(venue) {
    const confirmed = window.confirm(
      `Permanently remove "${venue.name}"? This is only allowed when the listing has no future or active bookings/events.`
    )

    if (!confirmed) return

    try {
      await apiDelete(`/venues/${venue.id}`, { owner_id: currentUser.id })
      await loadData()
      showSuccess('Venue listing permanently removed.')
    } catch (error) {
      showError(error.message || 'Could not permanently remove venue listing.')
    }
  }

  async function saveAvailability(event) {
    event.preventDefault()

    if (!availabilityForm.venue_id || !availabilityForm.available_date) {
      showError('Choose a venue and date before saving availability.')
      return
    }

    try {
      const savedAvailability = await apiPost('/venue-availability', {
        owner_id: currentUser.id,
        venue_id: availabilityForm.venue_id,
        available_date: availabilityForm.available_date,
        is_available: availabilityForm.is_available,
        price_override: availabilityForm.price_override || null,
        notes: availabilityForm.notes.trim() || null,
      })
      setAvailabilityForm(openAvailabilityVenueId ? {
        venue_id: String(savedAvailability.venue_id),
        available_date: getDateValue(savedAvailability.available_date),
        is_available: savedAvailability.is_available === true,
        price_override: savedAvailability.price_override || '',
        notes: savedAvailability.notes || '',
      } : emptyAvailability)
      await loadData()
      showSuccess('Availability date saved.')
    } catch (error) {
      showError(error.message || 'Could not save availability date.')
    }
  }

  async function respondToBooking(requestId, status) {
    const proposal = counterProposals[requestId] || ''

    if (status === 'Counter Proposal' && !proposal.trim()) {
      showError('Add a counter-proposal before sending it.')
      return
    }

    try {
      await apiPatch(`/booking-requests/${requestId}/owner-response`, {
        owner_id: currentUser.id,
        status,
        counter_proposal: proposal.trim() || undefined,
      })
      await loadData()
      showSuccess(`Booking request updated to ${status}.`)
    } catch (error) {
      showError(error.message || 'Could not update booking request.')
    }
  }

  function exportPerformancePdf() {
    const lines = [
      'PopEyez Venue Owner Performance Report',
      `Generated: ${new Date().toLocaleString()}`,
      `Owner: ${profile.full_name}`,
      `Company: ${profile.company_name}`,
      '',
      'Summary',
      `Total venues: ${summary.totalVenues}`,
      `Total requests: ${requests.length}`,
      `Approved bookings: ${summary.approvedBookings}`,
      `Declined bookings: ${summary.declinedBookings}`,
      `Pending requests: ${summary.pendingRequests}`,
      `Total revenue: ${formatMoney(summary.totalRevenue)}`,
      '',
      'Revenue and Booking Rate by Venue',
      ...venuePerformance.flatMap((venue) => wrapPdfLine(
        `${venue.name}: ${venue.totalRequests} requests, ${venue.approvedBookings} approved, ${venue.bookingRate}% booking rate, ${formatMoney(venue.revenue)} revenue.`
      )),
      '',
      'Historical Booking Data',
      ...bookingHistory.flatMap((request) => wrapPdfLine(
        `#${request.id} ${request.event_name} at ${request.venue_name} on ${formatDate(request.requested_date)}. Organizer: ${request.organizer_name} (${request.organizer_email || 'no email'}). Status: ${request.status}. Revenue counted: ${request.status === 'Approved' ? formatMoney(getRequestRevenue(request)) : formatMoney(0)}.`
      )),
    ]

    downloadTextFile('venue-owner-performance-report.pdf', buildPdfDocument(lines), 'application/pdf')
    showSuccess('Performance report downloaded as PDF.')
  }

  if (loading) {
    return (
      <section className="page-panel">
        <p className="eyebrow">Venue owner workspace</p>
        <h1>Loading Venue Owner Workspace</h1>
      </section>
    )
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">{pageInfo.eyebrow}</p>
        <h1>{pageInfo.title}</h1>
        <p>{pageInfo.description}</p>
      </div>

      {message && <p className={isError ? 'error-text' : 'status-message'}>{message}</p>}

      {activePage === 'dashboard' && (
        <>
          <section className="stats-grid">
            <article><span>Total venues</span><strong>{summary.totalVenues}</strong></article>
            <article><span>Active venues</span><strong>{summary.activeVenues}</strong></article>
            <article><span>Inactive venues</span><strong>{summary.inactiveVenues}</strong></article>
            <article><span>Pending requests</span><strong>{summary.pendingRequests}</strong></article>
            <article><span>Approved bookings</span><strong>{summary.approvedBookings}</strong></article>
            <article><span>Declined bookings</span><strong>{summary.declinedBookings}</strong></article>
            <article><span>Upcoming confirmed</span><strong>{summary.upcomingConfirmed}</strong></article>
            <article><span>Approved revenue</span><strong>{formatMoney(summary.totalRevenue)}</strong></article>
          </section>

          <section className="page-panel">
            <div className="panel-header"><h2>Upcoming Confirmed Bookings</h2><span>{summary.upcomingConfirmed}</span></div>
            {upcomingConfirmedBookings.length === 0 ? (
              <p className="empty-state">Upcoming approved booking reminders will appear here.</p>
            ) : (
              <ul className="list data-list">
                {upcomingConfirmedBookings.map((request) => (
                  <li key={request.id}>
                    <strong>{request.event_name}</strong>
                    <span>{request.venue_name} · {formatDate(request.requested_date)}</span>
                    <span><b>Organizer:</b> {request.organizer_name} · {request.organizer_email || 'No email'}</span>
                    <span className="review-status warning-status">Upcoming booking reminder</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="page-panel">
            <div className="panel-header"><h2>Per-Venue Performance</h2><span>{venuePerformance.length}</span></div>
            {venuePerformance.length === 0 ? (
              <p className="empty-state">Create venues and receive booking requests to see performance.</p>
            ) : (
              <ul className="list data-list">
                {venuePerformance.map((venue) => (
                  <li key={venue.id}>
                    <strong>{venue.name}</strong>
                    <span><b>Total requests:</b> {venue.totalRequests} · <b>Approved:</b> {venue.approvedBookings}</span>
                    <span><b>Booking rate:</b> {venue.bookingRate}% · <b>Revenue:</b> {formatMoney(venue.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {activePage === 'venue-owner-profile' && (
        <section className="page-panel">
          <div className="panel-header"><h2>Profile Details</h2></div>
          <form className="form compact-form" onSubmit={saveProfile}>
            <label>
              Owner name
              <input value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} required />
            </label>
            <label>
              Contact phone
              <input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} required />
            </label>
            <label>
              Company name
              <input value={profile.company_name} onChange={(event) => setProfile({ ...profile, company_name: event.target.value })} required />
            </label>
            <button type="submit">Save Profile</button>
          </form>
        </section>
      )}

      {activePage === 'venue-listings' && (
        <>
          <section className="page-panel">
            <div className="panel-header"><h2>{editingVenueId ? 'Edit Venue Listing' : 'Create Venue Listing'}</h2></div>
            <form className="form compact-form" onSubmit={saveVenue}>
              <div className="two-column">
                <label>Venue name<input value={venueForm.name} onChange={(event) => setVenueForm({ ...venueForm, name: event.target.value })} required /></label>
                <label>City<input value={venueForm.city} onChange={(event) => setVenueForm({ ...venueForm, city: event.target.value })} required /></label>
                <label>Location<input value={venueForm.location} onChange={(event) => setVenueForm({ ...venueForm, location: event.target.value })} required /></label>
                <label>Capacity<input type="number" min="1" value={venueForm.capacity} onChange={(event) => setVenueForm({ ...venueForm, capacity: event.target.value })} required /></label>
                <label>Dimensions in square meters<input type="number" min="1" value={venueForm.dimensions_sqm} onChange={(event) => setVenueForm({ ...venueForm, dimensions_sqm: event.target.value })} /></label>
                <label>Daily price<input type="number" min="0" value={venueForm.daily_price} onChange={(event) => setVenueForm({ ...venueForm, daily_price: event.target.value })} /></label>
                <label>
                  Venue photo
                  <input
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={(event) => setVenueForm({ ...venueForm, photo_file: event.target.files?.[0] || null })}
                    type="file"
                  />
                  <span className="input-hint">JPG, PNG, or WEBP up to 10MB.</span>
                </label>
                <label>
                  Floor plan
                  <input
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => setVenueForm({ ...venueForm, floor_plan_file: event.target.files?.[0] || null })}
                    type="file"
                  />
                  <span className="input-hint">PDF, JPG, or PNG up to 10MB.</span>
                </label>
              </div>
              <VenuePhotoPreview src={venueForm.photo_url} name={venueForm.name} />
              <div className="media-links">
                {venueForm.photo_url && (
                  <a href={getDocumentHref(venueForm.photo_url)} rel="noreferrer" target="_blank">Open current venue photo</a>
                )}
                {venueForm.floor_plan_url && (
                  <a href={getDocumentHref(venueForm.floor_plan_url)} rel="noreferrer" target="_blank">Open current floor plan</a>
                )}
                {venueForm.photo_file && <span>Selected photo: {venueForm.photo_file.name}</span>}
                {venueForm.floor_plan_file && <span>Selected floor plan: {venueForm.floor_plan_file.name}</span>}
              </div>
              <label>Description<textarea value={venueForm.description} onChange={(event) => setVenueForm({ ...venueForm, description: event.target.value })} /></label>
              <label>Amenities<textarea value={venueForm.amenities} onChange={(event) => setVenueForm({ ...venueForm, amenities: event.target.value })} /></label>
              <div className="inline-actions">
                <button type="submit">{editingVenueId ? 'Save Changes' : 'Create Listing'}</button>
                {editingVenueId && <button className="secondary-button" type="button" onClick={resetVenueForm}>Cancel Edit</button>}
              </div>
            </form>
          </section>

          <section className="page-panel">
            <div className="panel-header"><h2>Your Venue Listings</h2><span>{venues.length}</span></div>
            {venues.length === 0 ? (
              <p className="empty-state">You have not created any venue listings yet.</p>
            ) : (
              <ul className="list data-list venue-list">
                {venues.map((venue) => (
                  <li key={venue.id}>
                    <VenuePhotoPreview src={venue.photo_url} name={venue.name} />
                    <strong>{venue.name}</strong>
                    <span className={`review-status ${getStatusClass(venue.status)}`}>{venue.status}</span>
                    <span>{venue.description || 'No description provided.'}</span>
                    <span><b>Location:</b> {venue.location} · {venue.city || 'No city'}</span>
                    <span><b>Capacity:</b> {venue.capacity} · <b>Dimensions:</b> {venue.dimensions_sqm || 'Not set'} m2</span>
                    <span><b>Amenities:</b> {venue.amenities || 'No amenities listed.'}</span>
                    <span><b>Daily price:</b> {formatMoney(venue.daily_price)}</span>
                    <span>
                      <b>Photo:</b> {venue.photo_url
                        ? <a href={getDocumentHref(venue.photo_url)} rel="noreferrer" target="_blank">Open venue photo</a>
                        : 'No photo uploaded.'}
                    </span>
                    <span>
                      <b>Floor plan:</b> {venue.floor_plan_url
                        ? <a href={getDocumentHref(venue.floor_plan_url)} rel="noreferrer" target="_blank">Open floor plan</a>
                        : 'No floor plan uploaded.'}
                    </span>
                    <div className="inline-actions">
                      <button type="button" onClick={() => editVenue(venue)}>Edit</button>
                      <button className="secondary-button" type="button" onClick={() => toggleListingCalendar(venue.id)}>
                        {openAvailabilityVenueId === venue.id ? 'Hide Calendar' : 'Manage Calendar'}
                      </button>
                      {venue.status === 'Active' ? (
                        <button className="danger-button" type="button" onClick={() => changeVenueStatus(venue.id, 'Inactive')}>Deactivate</button>
                      ) : (
                        <button className="secondary-button" type="button" onClick={() => changeVenueStatus(venue.id, 'Active')}>Reactivate</button>
                      )}
                      <button className="danger-button" type="button" onClick={() => removeVenue(venue)}>Remove</button>
                    </div>
                    {openAvailabilityVenueId === venue.id && (
                      <div className="listing-calendar-editor">
                        <OwnerAvailabilityCalendar
                          availability={availability.filter((item) => item.venue_id === venue.id)}
                          month={listingCalendarMonth}
                          onMonthChange={setListingCalendarMonth}
                          onSelectDate={(date, record) => selectListingCalendarDate(venue.id, date, record)}
                          selectedDate={availabilityForm.venue_id === String(venue.id) ? availabilityForm.available_date : ''}
                        />

                        {availabilityForm.venue_id === String(venue.id) && availabilityForm.available_date ? (
                          <form className="form compact-form availability-edit-form" onSubmit={saveAvailability}>
                            <p className="selected-date">Editing {formatDate(availabilityForm.available_date)} for {venue.name}</p>
                            <div className="two-column">
                              <label>
                                Status
                                <select value={availabilityForm.is_available ? 'true' : 'false'} onChange={(event) => setAvailabilityForm({ ...availabilityForm, is_available: event.target.value === 'true' })}>
                                  <option value="true">Available</option>
                                  <option value="false">Unavailable</option>
                                </select>
                              </label>
                            </div>
                            <label>
                              Notes
                              <textarea value={availabilityForm.notes} onChange={(event) => setAvailabilityForm({ ...availabilityForm, notes: event.target.value })} />
                            </label>
                            <button type="submit">Save Calendar Date</button>
                          </form>
                        ) : (
                          <p className="selected-date">Click any day to add or edit availability for this venue.</p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {activePage === 'venue-booking-requests' && (
        <section className="page-panel">
          <div className="panel-header"><h2>Organizer Booking Requests</h2><span>{filteredRequests.length}</span></div>
          <div className="filter-row">
            <select value={requestFilters.venue_id} onChange={(event) => setRequestFilters({ ...requestFilters, venue_id: event.target.value })}>
              <option value="">All venues</option>
              {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
            </select>
            <select value={requestFilters.status} onChange={(event) => setRequestFilters({ ...requestFilters, status: event.target.value })}>
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
              <option value="Counter Proposal">Counter Proposal</option>
            </select>
            <label className="filter-date-label">
              From date
              <input type="date" value={requestFilters.from} onChange={(event) => setRequestFilters({ ...requestFilters, from: event.target.value })} />
            </label>
            <label className="filter-date-label">
              To date
              <input type="date" value={requestFilters.to} onChange={(event) => setRequestFilters({ ...requestFilters, to: event.target.value })} />
            </label>
            <button className="secondary-button" type="button" onClick={() => setRequestFilters({ venue_id: '', status: '', from: '', to: '' })}>Clear Filters</button>
          </div>
          {requests.length === 0 ? (
            <p className="empty-state">No booking requests have been submitted for your venues yet.</p>
          ) : filteredRequests.length === 0 ? (
            <p className="empty-state">No booking requests match the selected filters.</p>
          ) : (
            <ul className="list data-list venue-list">
              {filteredRequests.map((request) => (
                <li key={request.id}>
                  <strong>{request.event_name}</strong>
                  <span className={`review-status ${getStatusClass(request.status)}`}>{request.status}</span>
                  <span><b>Venue:</b> {request.venue_name}</span>
                  <span><b>Organizer:</b> {request.organizer_name} · {request.organizer_email || 'No email'} {request.organizer_phone ? `· ${request.organizer_phone}` : ''}</span>
                  <span><b>Event date:</b> {formatDate(request.requested_date)}</span>
                  <span><b>Expected attendees:</b> {request.expected_attendees || 'Not provided'}</span>
                  <span><b>Proposed price:</b> {formatMoney(request.proposed_price)}</span>
                  <span><b>Special requirements:</b> {request.special_requirements || 'None provided.'}</span>
                  {request.counter_proposal && <span><b>Counter proposal:</b> {request.counter_proposal}</span>}
                  {['Approved', 'Declined'].includes(request.status) ? (
                    <span className="protected-label">Final response saved. Organizer can see this status.</span>
                  ) : (
                    <>
                      <textarea
                        className="inline-textarea"
                        placeholder="Counter-proposal details, adjusted pricing, or alternate date"
                        value={counterProposals[request.id] || ''}
                        onChange={(event) => setCounterProposals({ ...counterProposals, [request.id]: event.target.value })}
                      />
                      <div className="inline-actions">
                        <button type="button" onClick={() => respondToBooking(request.id, 'Approved')}>Approve</button>
                        <button className="danger-button" type="button" onClick={() => respondToBooking(request.id, 'Declined')}>Decline</button>
                        <button className="secondary-button" type="button" onClick={() => respondToBooking(request.id, 'Counter Proposal')}>Send Counter</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activePage === 'venue-confirmed-bookings' && (
        <>
          <section className="page-panel">
            <div className="panel-header"><h2>Confirmed Booking Filters</h2><span>{filteredConfirmedBookings.length}</span></div>
            <div className="filter-row">
              <select value={confirmedFilters.venue_id} onChange={(event) => setConfirmedFilters({ ...confirmedFilters, venue_id: event.target.value })}>
                <option value="">All venues</option>
                {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
              </select>
              <select value={confirmedFilters.status} onChange={(event) => setConfirmedFilters({ ...confirmedFilters, status: event.target.value })}>
                <option value="">All statuses</option>
                <option value="Approved">Approved</option>
              </select>
              <label className="filter-date-label">
                From date
                <input type="date" value={confirmedFilters.from} onChange={(event) => setConfirmedFilters({ ...confirmedFilters, from: event.target.value })} />
              </label>
              <label className="filter-date-label">
                To date
                <input type="date" value={confirmedFilters.to} onChange={(event) => setConfirmedFilters({ ...confirmedFilters, to: event.target.value })} />
              </label>
              <button className="secondary-button" type="button" onClick={() => setConfirmedFilters({ venue_id: '', status: 'Approved', from: '', to: '' })}>Clear Filters</button>
            </div>
          </section>

          <section className="page-panel">
            <div className="panel-header"><h2>Upcoming Bookings</h2><span>{upcomingConfirmedBookings.length}</span></div>
            {upcomingConfirmedBookings.length === 0 ? (
              <p className="empty-state">No upcoming confirmed bookings yet.</p>
            ) : (
              <ul className="list data-list">
                {upcomingConfirmedBookings.map((request) => (
                  <li key={request.id}>
                    <strong>{request.event_name}</strong>
                    <span>{request.venue_name} · {formatDate(request.requested_date)}</span>
                    <span><b>Organizer:</b> {request.organizer_name} · {request.organizer_email || 'No email'} {request.organizer_phone ? `· ${request.organizer_phone}` : ''}</span>
                    <span><b>Expected attendees:</b> {request.expected_attendees || 'Not provided'}</span>
                    <span><b>Approved revenue:</b> {formatMoney(getRequestRevenue(request))}</span>
                    <span className="review-status warning-status">Reminder: upcoming confirmed booking</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="page-panel">
            <div className="panel-header"><h2>Confirmed Booking History</h2><span>{filteredConfirmedBookings.length}</span></div>
            {confirmedBookings.length === 0 ? (
              <p className="empty-state">Approved bookings will appear here after you approve organizer requests.</p>
            ) : filteredConfirmedBookings.length === 0 ? (
              <p className="empty-state">No confirmed bookings match the selected filters.</p>
            ) : (
              <ul className="list data-list venue-list">
                {filteredConfirmedBookings.map((request) => (
                  <li key={request.id}>
                    <strong>{request.event_name}</strong>
                    <span className="review-status good-status">{request.status}</span>
                    <span><b>Venue:</b> {request.venue_name}</span>
                    <span><b>Organizer:</b> {request.organizer_name} · {request.organizer_email || 'No email'} {request.organizer_phone ? `· ${request.organizer_phone}` : ''}</span>
                    <span><b>Event date:</b> {formatDate(request.requested_date)}</span>
                    <span><b>Expected attendees:</b> {request.expected_attendees || 'Not provided'}</span>
                    <span><b>Proposed price:</b> {formatMoney(request.proposed_price)} · <b>Revenue used:</b> {formatMoney(getRequestRevenue(request))}</span>
                    <span><b>Special requirements:</b> {request.special_requirements || 'None provided.'}</span>
                    {request.counter_proposal && <span><b>Counter proposal:</b> {request.counter_proposal}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {activePage === 'venue-performance' && (
        <>
          <section className="stats-grid">
            <article><span>Total venues</span><strong>{summary.totalVenues}</strong></article>
            <article><span>Total requests</span><strong>{requests.length}</strong></article>
            <article><span>Approved bookings</span><strong>{summary.approvedBookings}</strong></article>
            <article><span>Declined bookings</span><strong>{summary.declinedBookings}</strong></article>
            <article><span>Pending requests</span><strong>{summary.pendingRequests}</strong></article>
            <article><span>Total revenue</span><strong>{formatMoney(summary.totalRevenue)}</strong></article>
          </section>

          <section className="page-panel">
            <div className="panel-header"><h2>Export Reports</h2></div>
            <div className="inline-actions">
              <button type="button" onClick={exportPerformancePdf}>Download PDF Report</button>
            </div>
          </section>

          <section className="page-panel">
            <div className="panel-header"><h2>Revenue and Booking Rate by Venue</h2><span>{venuePerformance.length}</span></div>
            {venuePerformance.length === 0 ? (
              <p className="empty-state">No venue performance data yet.</p>
            ) : (
              <ul className="list data-list">
                {venuePerformance.map((venue) => (
                  <li key={venue.id}>
                    <strong>{venue.name}</strong>
                    <span><b>Total booking requests:</b> {venue.totalRequests}</span>
                    <span><b>Approved bookings:</b> {venue.approvedBookings}</span>
                    <span><b>Booking rate:</b> {venue.bookingRate}%</span>
                    <span><b>Revenue:</b> {formatMoney(venue.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="page-panel">
            <div className="panel-header"><h2>Historical Booking Data</h2><span>{bookingHistory.length}</span></div>
            {requests.length === 0 ? (
              <p className="empty-state">No historical booking records yet.</p>
            ) : (
              <ul className="list data-list venue-list">
                {bookingHistory.map((request) => (
                  <li key={request.id}>
                    <strong>{request.event_name}</strong>
                    <span>{request.venue_name} · {formatDate(request.requested_date)} · {request.status}</span>
                    <span><b>Organizer:</b> {request.organizer_name} · {request.organizer_email || 'No email'}</span>
                    <span><b>Event type:</b> {request.event_type || 'Not provided'} · <b>Expected attendees:</b> {request.expected_attendees || 'Not provided'}</span>
                    <span><b>Revenue counted:</b> {request.status === 'Approved' ? formatMoney(getRequestRevenue(request)) : formatMoney(0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default VenueOwnerWorkspace
