/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api'

function VendorCoordination({ currentUser }) {
  const [events, setEvents] = useState([])
  const [vendors, setVendors] = useState([])
  const [requests, setRequests] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [invoices, setInvoices] = useState([])
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ event_id: '', vendor_id: '', requested_items: '', delivery_date: '' })

  async function loadData() {
    const [eventsData, vendorsData, requestsData, deliveriesData, invoicesData] = await Promise.all([
      apiGet('/events'),
      apiGet(search ? `/vendors/search?supplies_offered=${encodeURIComponent(search)}` : '/vendors'),
      apiGet('/sourcing-requests'),
      apiGet('/deliveries'),
      apiGet('/invoices'),
    ])
    setEvents(eventsData)
    setVendors(vendorsData)
    setRequests(requestsData)
    setDeliveries(deliveriesData)
    setInvoices(invoicesData)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => setMessage('Could not load vendor data.'))
  }, [search])

  async function createRequest(event) {
    event.preventDefault()
    if (!currentUser?.id) {
      setMessage('Please log in as an organizer before creating sourcing requests.')
      return
    }

    try {
      await apiPost('/sourcing-requests', {
        event_id: form.event_id,
        vendor_id: form.vendor_id,
        organizer_id: currentUser.id,
        requested_items: form.requested_items,
        delivery_date: form.delivery_date || null,
        status: 'Pending',
      })
      setForm({ event_id: '', vendor_id: '', requested_items: '', delivery_date: '' })
      setMessage('Sourcing request sent.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not create sourcing request.')
    }
  }

  async function updateInvoiceStatus(id, status) {
    try {
      await apiPatch(`/invoices/${id}/status`, { status })
      setMessage('Invoice status updated.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not update invoice status.')
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Vendor coordination</p>
        <h1>Vendors, Sourcing, Deliveries</h1>
        <p>Search suppliers, request items, track delivery status, and review invoices.</p>
      </div>
      {message && <p className="status-message">{message}</p>}

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Vendors</h2><span>{vendors.length}</span></div>
          <input className="full-input" placeholder="Search supplies offered" value={search} onChange={(e) => setSearch(e.target.value)} />
          <ul className="list data-list">
            {vendors.map((vendor) => (
              <li key={vendor.id}>
                <strong>{vendor.company_name}</strong>
                <span>{vendor.supplies_offered} · {vendor.main_location}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Create Sourcing Request</h2></div>
          <form className="form compact-form" onSubmit={createRequest}>
            <select value={form.event_id} onChange={(e) => setForm({ ...form, event_id: e.target.value })} required>
              <option value="">Choose event</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
            <select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} required>
              <option value="">Choose vendor</option>
              {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.company_name}</option>)}
            </select>
            <input placeholder="Requested items" value={form.requested_items} onChange={(e) => setForm({ ...form, requested_items: e.target.value })} required />
            <input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
            <button type="submit">Send Request</button>
          </form>
        </section>
      </div>

      <div className="three-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Sourcing Requests</h2><span>{requests.length}</span></div>
          <ul className="list data-list">
            {requests.map((request) => (
              <li key={request.id}>
                <strong>{request.requested_items}</strong>
                <span>Vendor #{request.vendor_id} · {request.status}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="page-panel">
          <div className="panel-header"><h2>Deliveries</h2><span>{deliveries.length}</span></div>
          <ul className="list data-list">
            {deliveries.map((delivery) => (
              <li key={delivery.id}>
                <strong>Delivery #{delivery.id}</strong>
                <span>Vendor #{delivery.vendor_id} · {delivery.status}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="page-panel">
          <div className="panel-header"><h2>Invoices</h2><span>{invoices.length}</span></div>
          <ul className="list data-list">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <strong>{invoice.invoice_number || `Invoice #${invoice.id}`}</strong>
                <span>{Number(invoice.amount).toLocaleString()} · {invoice.status}</span>
                <select value={invoice.status} onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value)}>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default VendorCoordination
