import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api'
import DateSelect from '../components/DateSelect'

const emptyRequestForm = {
  event_id: '',
  vendor_id: '',
  requested_items: '',
  quantity: '',
  delivery_date: '',
  event_location: '',
  notes: '',
}

function getTodayDate() {
  const today = new Date()
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) {
    return 'Not scheduled'
  }

  const dateValue = value.includes('T') ? new Date(value) : new Date(`${value.slice(0, 10)}T00:00:00`)
  return value.includes('T') ? dateValue.toLocaleString() : dateValue.toLocaleDateString()
}

function VendorCoordination({ currentUser }) {
  const [events, setEvents] = useState([])
  const [vendors, setVendors] = useState([])
  const [requests, setRequests] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [invoices, setInvoices] = useState([])
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyRequestForm)
  const todayDate = getTodayDate()

  const loadData = useCallback(async function loadData() {
    const organizerQuery = `organizer_id=${currentUser.id}`
    const vendorPath = search.trim()
      ? `/vendors/search?q=${encodeURIComponent(search.trim())}`
      : '/vendors'

    const [eventsData, vendorsData, requestsData, deliveriesData, invoicesData] = await Promise.all([
      apiGet(`/events?organizer_id=${currentUser.id}`),
      apiGet(vendorPath),
      apiGet(`/sourcing-requests?${organizerQuery}`),
      apiGet(`/deliveries?${organizerQuery}`),
      apiGet(`/invoices?${organizerQuery}`),
    ])

    setEvents(eventsData)
    setVendors(vendorsData)
    setRequests(requestsData)
    setDeliveries(deliveriesData)
    setInvoices(invoicesData)
  }, [currentUser.id, search])

  useEffect(() => {
    let ignore = false

    async function loadPage() {
      try {
        await loadData()
        if (!ignore) {
          setMessage('')
          setIsError(false)
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.message || 'Could not load vendor coordination data.')
          setIsError(true)
        }
      }
    }

    loadPage()
    return () => {
      ignore = true
    }
  }, [loadData])

  async function createRequest(event) {
    event.preventDefault()

    if (!currentUser?.id) {
      setMessage('Please log in as an organizer before creating sourcing requests.')
      setIsError(true)
      return
    }

    if (
      !form.event_id
      || !form.vendor_id
      || !form.requested_items.trim()
      || !form.quantity.trim()
      || !form.delivery_date
      || !form.event_location.trim()
    ) {
      setMessage('Event, vendor, requested items, quantity, delivery date, and event location are required.')
      setIsError(true)
      return
    }

    if (form.delivery_date < todayDate) {
      setMessage('Delivery date cannot be in the past.')
      setIsError(true)
      return
    }

    try {
      await apiPost('/sourcing-requests', {
        event_id: form.event_id,
        vendor_id: form.vendor_id,
        organizer_id: currentUser.id,
        requested_items: form.requested_items.trim(),
        quantity: form.quantity.trim(),
        delivery_date: form.delivery_date,
        event_location: form.event_location.trim(),
        notes: form.notes.trim() || null,
      })
      setForm(emptyRequestForm)
      setMessage('Sourcing request submitted to the vendor.')
      setIsError(false)
      await loadData()
    } catch (error) {
      setMessage(error.message || 'Could not create sourcing request.')
      setIsError(true)
    }
  }

  async function reviewInvoice(id, status) {
    try {
      await apiPatch(`/invoices/${id}/status`, { status, organizer_id: currentUser.id })
      setMessage(`Invoice ${status === 'Approved' ? 'approved' : 'rejected'}.`)
      setIsError(false)
      await loadData()
    } catch (error) {
      setMessage(error.message || 'Could not review invoice.')
      setIsError(true)
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Vendor coordination</p>
        <h1>Vendors, Sourcing, Deliveries and Invoices</h1>
        <p>Find suppliers, submit sourcing requests, track fulfilment, and review vendor invoices.</p>
      </div>

      {message && <p className={isError ? 'error-text' : 'status-message'}>{message}</p>}

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Vendor Directory</h2><span>{vendors.length}</span></div>
          <input
            className="full-input"
            placeholder="Search company, supplies, location, or pricing"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {vendors.length === 0 ? (
            <p className="empty-state">No active vendors match this search.</p>
          ) : (
            <ul className="list data-list vendor-list">
              {vendors.map((vendor) => (
                <li key={vendor.id}>
                  <strong>{vendor.company_name}</strong>
                  <span><b>Supplies:</b> {vendor.supplies_offered}</span>
                  <span><b>Location:</b> {vendor.main_location || 'Not provided'}</span>
                  <span><b>Pricing:</b> {vendor.pricing_list || 'Contact vendor for pricing'}</span>
                  <span>
                    <b>Contact:</b> {vendor.contact_email || 'No email'}
                    {vendor.contact_phone ? ` · ${vendor.contact_phone}` : ''}
                  </span>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, vendor_id: String(vendor.id) }))}
                  >
                    Request from Vendor
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Submit Sourcing Request</h2></div>
          <form className="form compact-form" onSubmit={createRequest}>
            <label>
              Event
              <select value={form.event_id} onChange={(event) => setForm({ ...form, event_id: event.target.value })} required>
                <option value="">Choose event</option>
                {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
              </select>
            </label>
            <label>
              Vendor
              <select value={form.vendor_id} onChange={(event) => setForm({ ...form, vendor_id: event.target.value })} required>
                <option value="">Choose vendor</option>
                {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.company_name}</option>)}
              </select>
            </label>
            <label>
              Requested items
              <textarea
                placeholder="Describe the supplies or services needed"
                value={form.requested_items}
                onChange={(event) => setForm({ ...form, requested_items: event.target.value })}
                required
              />
            </label>
            <label>
              Quantity
              <input placeholder="Example: 85 guest package or 2 speaker sets" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required />
            </label>
            <label>
              Delivery date
              <DateSelect
                value={form.delivery_date}
                onChange={(date) => setForm({ ...form, delivery_date: date })}
                minYear={2026}
                maxYear={2035}
                minDate={todayDate}
                required
              />
            </label>
            <label>
              Event location
              <input placeholder="Venue or delivery address" value={form.event_location} onChange={(event) => setForm({ ...form, event_location: event.target.value })} required />
            </label>
            <label>
              Notes
              <textarea placeholder="Setup time, dietary needs, access instructions, etc." value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </label>
            <button type="submit">Submit Request</button>
          </form>
        </section>
      </div>

      <section className="page-panel">
        <div className="panel-header"><h2>Sourcing Request Status</h2><span>{requests.length}</span></div>
        {requests.length === 0 ? (
          <p className="empty-state">No sourcing requests have been submitted.</p>
        ) : (
          <ul className="list data-list">
            {requests.map((request) => (
              <li key={request.id}>
                <strong>{request.requested_items}</strong>
                <span>{request.event_name} · {request.vendor_name} · {request.status}</span>
                <span>
                  Quantity: {request.quantity} · Delivery: {formatDate(request.delivery_date)}
                </span>
                <span>{request.event_location} · {request.notes || 'No additional notes'}</span>
                {request.clarification_note && <span><b>Vendor clarification:</b> {request.clarification_note}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Vendor Deliveries</h2><span>{deliveries.length}</span></div>
          {deliveries.length === 0 ? (
            <p className="empty-state">No deliveries are being tracked yet.</p>
          ) : (
            <ul className="list data-list">
              {deliveries.map((delivery) => (
                <li key={delivery.id}>
                  <strong>{delivery.vendor_name}</strong>
                  <span>{delivery.event_name} · {delivery.status}</span>
                  <span>Scheduled: {formatDate(delivery.scheduled_arrival)}</span>
                  <span>{delivery.confirmation_notes || 'No delivery notes'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Vendor Invoices</h2><span>{invoices.length}</span></div>
          {invoices.length === 0 ? (
            <p className="empty-state">No vendor invoices have been submitted.</p>
          ) : (
            <ul className="list data-list invoice-list">
              {invoices.map((invoice) => (
                <li key={invoice.id}>
                  <strong>{invoice.invoice_number || `Invoice #${invoice.id}`}</strong>
                  <span>{invoice.vendor_name} · {invoice.event_name}</span>
                  <span>{Number(invoice.amount).toLocaleString()} EGP · {invoice.status}</span>
                  <span>{invoice.itemized_breakdown || 'No itemized breakdown provided'}</span>
                  {invoice.supporting_document_url?.startsWith('http') ? (
                    <a href={invoice.supporting_document_url} target="_blank" rel="noreferrer">View supporting document</a>
                  ) : invoice.supporting_document_url ? (
                    <span><b>Document reference:</b> {invoice.supporting_document_url}</span>
                  ) : (
                    <span>No supporting document provided</span>
                  )}
                  {invoice.status === 'Pending Review' && (
                    <div className="inline-actions">
                      <button type="button" onClick={() => reviewInvoice(invoice.id, 'Approved')}>Approve</button>
                      <button className="danger-button" type="button" onClick={() => reviewInvoice(invoice.id, 'Rejected')}>Reject</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default VendorCoordination
