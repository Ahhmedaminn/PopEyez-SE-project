import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL, apiGet, apiPatch, apiPostForm, apiPut } from '../api'

const emptyProfile = {
  company_name: '',
  supplies_offered: '',
  main_location: '',
  pricing_list: '',
  contact_email: '',
  contact_phone: '',
}

const emptyInvoice = {
  delivery_id: '',
  invoice_number: '',
  amount: '',
  itemized_breakdown: '',
  supporting_document_file: null,
}

const deliveryStatuses = ['Preparing', 'Out for Delivery', 'Delivered', 'Delayed']

function formatDate(value) {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function formatDateOnly(value) {
  if (!value) return 'Not scheduled'
  const dateText = String(value).slice(0, 10)
  const date = new Date(`${dateText}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString()} EGP`
}

function getInvoiceStatusMessage(status) {
  if (status === 'Approved') return 'Reviewed and approved by organizer.'
  if (status === 'Paid') return 'Marked as paid by organizer.'
  if (status === 'Rejected') return 'Reviewed and rejected by organizer.'
  return 'Waiting for organizer review.'
}

function getDocumentHref(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '')
  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`
}

function VendorWorkspace({ currentUser, activePage = 'dashboard' }) {
  const [vendor, setVendor] = useState(null)
  const [profile, setProfile] = useState(emptyProfile)
  const [requests, setRequests] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [invoices, setInvoices] = useState([])
  const [clarifications, setClarifications] = useState({})
  const [deliveryNotes, setDeliveryNotes] = useState({})
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async function loadData() {
    const [profileData, requestData, deliveryData, invoiceData] = await Promise.all([
      apiGet(`/vendors/by-user/${currentUser.id}`),
      apiGet(`/sourcing-requests/vendor-user/${currentUser.id}`),
      apiGet(`/deliveries/vendor-user/${currentUser.id}`),
      apiGet(`/invoices/vendor-user/${currentUser.id}`),
    ])

    setVendor(profileData)
    setProfile({
      company_name: profileData.company_name || '',
      supplies_offered: profileData.supplies_offered || '',
      main_location: profileData.main_location || '',
      pricing_list: profileData.pricing_list || '',
      contact_email: profileData.contact_email || '',
      contact_phone: profileData.contact_phone || '',
    })
    setRequests(requestData)
    setDeliveries(deliveryData)
    setInvoices(invoiceData)
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
          setMessage(error.message || 'Could not load vendor workspace.')
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
    pendingRequests: requests.filter((request) => request.status === 'Pending').length,
    acceptedRequests: requests.filter((request) => request.status === 'Accepted').length,
    activeDeliveries: deliveries.filter((delivery) => delivery.status !== 'Delivered').length,
    delayedDeliveries: deliveries.filter((delivery) => delivery.status === 'Delayed').length,
    submittedInvoices: invoices.length,
    pendingInvoices: invoices.filter((invoice) => invoice.status === 'Pending Review').length,
    reviewedInvoices: invoices.filter((invoice) => ['Approved', 'Paid', 'Rejected'].includes(invoice.status)).length,
  }), [deliveries, invoices, requests])

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

    if (!profile.company_name.trim() || !profile.supplies_offered.trim()) {
      showError('Company name and supplies offered are required.')
      return
    }

    try {
      await apiPut(`/vendors/by-user/${currentUser.id}`, profile)
      await loadData()
      showSuccess('Vendor profile updated.')
    } catch (error) {
      showError(error.message || 'Could not update vendor profile.')
    }
  }

  async function reviewRequest(requestId, status) {
    const note = clarifications[requestId] || ''

    try {
      await apiPatch(`/sourcing-requests/${requestId}/vendor-review`, {
        vendor_user_id: currentUser.id,
        status,
        clarification_note: note.trim() || undefined,
      })
      await loadData()
      showSuccess(`Sourcing request ${status.toLowerCase()}.`)
    } catch (error) {
      showError(error.message || 'Could not update sourcing request.')
    }
  }

  async function saveClarification(requestId) {
    const note = clarifications[requestId] || ''

    if (!note.trim()) {
      showError('Clarification note cannot be empty.')
      return
    }

    try {
      await apiPatch(`/sourcing-requests/${requestId}/clarification`, {
        vendor_user_id: currentUser.id,
        clarification_note: note.trim(),
      })
      await loadData()
      showSuccess('Clarification note saved for the organizer.')
    } catch (error) {
      showError(error.message || 'Could not save clarification note.')
    }
  }

  async function updateDelivery(deliveryId, status) {
    const note = deliveryNotes[deliveryId] || ''

    if (status === 'Delayed' && !note.trim()) {
      showError('Add a delay note before marking this delivery as Delayed.')
      return
    }

    try {
      await apiPatch(`/deliveries/${deliveryId}/vendor-status`, {
        vendor_user_id: currentUser.id,
        status,
        confirmation_notes: note.trim() || undefined,
      })
      await loadData()
      showSuccess(`Delivery marked as ${status}.`)
    } catch (error) {
      showError(error.message || 'Could not update delivery status.')
    }
  }

  async function submitInvoice(event) {
    event.preventDefault()

    if (invoiceableDeliveries.length === 0) {
      showError('No deliveries are ready for a new invoice. Mark one of your uninvoiced deliveries as Delivered first.')
      return
    }

    if (
      !invoiceForm.delivery_id
      || !invoiceForm.invoice_number.trim()
      || Number(invoiceForm.amount) <= 0
      || !invoiceForm.itemized_breakdown.trim()
    ) {
      showError('Delivery, invoice number, amount, and itemized breakdown are required.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('vendor_user_id', currentUser.id)
      formData.append('delivery_id', invoiceForm.delivery_id)
      formData.append('invoice_number', invoiceForm.invoice_number.trim())
      formData.append('amount', invoiceForm.amount)
      formData.append('itemized_breakdown', invoiceForm.itemized_breakdown.trim())
      if (invoiceForm.supporting_document_file) {
        formData.append('supporting_document', invoiceForm.supporting_document_file)
      }

      await apiPostForm('/invoices/vendor-submit', formData)
      setInvoiceForm(emptyInvoice)
      await loadData()
      showSuccess('Invoice submitted for organizer review.')
    } catch (error) {
      showError(error.message || 'Could not submit invoice.')
    }
  }

  const invoicedDeliveryIds = new Set(
    invoices
      .filter((invoice) => invoice.delivery_id)
      .map((invoice) => String(invoice.delivery_id))
  )
  const invoiceByDeliveryId = new Map(
    invoices
      .filter((invoice) => invoice.delivery_id)
      .map((invoice) => [String(invoice.delivery_id), invoice])
  )
  const invoiceableDeliveries = deliveries.filter((delivery) => (
    delivery.status === 'Delivered'
    && !invoicedDeliveryIds.has(String(delivery.id))
  ))
  const invoiceNotifications = invoices.filter((invoice) => (
    ['Approved', 'Paid', 'Rejected'].includes(invoice.status)
  ))

  function getInvoiceReadiness(delivery) {
    const existingInvoice = invoiceByDeliveryId.get(String(delivery.id))

    if (existingInvoice) {
      return {
        className: existingInvoice.status === 'Rejected' ? 'bad-status' : 'good-status',
        text: `Already invoiced: ${existingInvoice.invoice_number || `Invoice #${existingInvoice.id}`} (${existingInvoice.status})`,
      }
    }

    if (delivery.status !== 'Delivered') {
      return {
        className: delivery.status === 'Delayed' ? 'bad-status' : 'warning-status',
        text: `Not ready: delivery is ${delivery.status}`,
      }
    }

    return {
      className: 'warning-status',
      text: 'Ready for a new invoice',
    }
  }
  const pageTitles = {
    dashboard: {
      eyebrow: 'Vendor overview',
      title: vendor?.company_name || 'Vendor Workspace',
      description: 'Review your current request, delivery, and invoice status at a glance.',
    },
    'vendor-profile': {
      eyebrow: 'Vendor profile',
      title: 'Company Profile',
      description: 'Keep company details, supplies, pricing, and contact information up to date.',
    },
    'vendor-requests': {
      eyebrow: 'Sourcing requests',
      title: 'Incoming Requests',
      description: 'Review organizer requests, accept or decline work, and save clarification notes.',
    },
    'vendor-deliveries': {
      eyebrow: 'Delivery management',
      title: 'Deliveries',
      description: 'Track accepted orders, update status, and report delays or arrival notes.',
    },
    'vendor-invoices': {
      eyebrow: 'Invoicing',
      title: 'Invoices',
      description: 'Submit invoices for completed deliveries and track organizer review status.',
    },
  }
  const pageInfo = pageTitles[activePage] || pageTitles.dashboard

  if (loading) {
    return (
      <section className="page-panel">
        <p className="eyebrow">Vendor workspace</p>
        <h1>Loading Vendor Workspace</h1>
      </section>
    )
  }

  if (!vendor) {
    return (
      <section className="page-panel notice-panel">
        <p className="eyebrow">Vendor workspace</p>
        <h1>Vendor Profile Missing</h1>
        <p>This vendor account does not have a connected vendor profile yet. Ask the organizer to recreate the vendor account or create a vendor profile.</p>
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
        <section className="stats-grid">
          <article><span>Pending requests</span><strong>{summary.pendingRequests}</strong></article>
          <article><span>Accepted requests</span><strong>{summary.acceptedRequests}</strong></article>
          <article><span>Active deliveries</span><strong>{summary.activeDeliveries}</strong></article>
          <article><span>Delayed deliveries</span><strong>{summary.delayedDeliveries}</strong></article>
          <article><span>Submitted invoices</span><strong>{summary.submittedInvoices}</strong></article>
          <article><span>Pending review</span><strong>{summary.pendingInvoices}</strong></article>
          <article><span>Reviewed invoices</span><strong>{summary.reviewedInvoices}</strong></article>
        </section>
      )}

      {activePage === 'vendor-profile' && (
        <section className="page-panel">
        <div className="panel-header"><h2>Company Profile</h2></div>
        <form className="form compact-form" onSubmit={saveProfile}>
          <div className="two-column">
            <label>
              Company name
              <input value={profile.company_name} onChange={(event) => setProfile({ ...profile, company_name: event.target.value })} required />
            </label>
            <label>
              Supplies offered
              <input value={profile.supplies_offered} onChange={(event) => setProfile({ ...profile, supplies_offered: event.target.value })} required />
            </label>
            <label>
              Main location
              <input value={profile.main_location} onChange={(event) => setProfile({ ...profile, main_location: event.target.value })} />
            </label>
            <label>
              Pricing list
              <input value={profile.pricing_list} onChange={(event) => setProfile({ ...profile, pricing_list: event.target.value })} />
            </label>
            <label>
              Contact email
              <input type="email" value={profile.contact_email} onChange={(event) => setProfile({ ...profile, contact_email: event.target.value })} />
            </label>
            <label>
              Contact phone
              <input value={profile.contact_phone} onChange={(event) => setProfile({ ...profile, contact_phone: event.target.value })} />
            </label>
          </div>
          <button type="submit">Save Profile</button>
        </form>
      </section>
      )}

      {activePage === 'vendor-requests' && (
        <section className="page-panel">
        <div className="panel-header"><h2>Incoming Sourcing Requests</h2><span>{requests.length}</span></div>
        {requests.length === 0 ? (
          <p className="empty-state">No sourcing requests yet.</p>
        ) : (
          <ul className="list data-list vendor-work-list">
            {requests.map((request) => (
              <li key={request.id}>
                <strong>{request.requested_items}</strong>
                <span>{request.event_name} · {request.status}</span>
                <span><b>Organizer:</b> {request.organizer_name} · {request.organizer_email || 'No email'} {request.organizer_phone ? `· ${request.organizer_phone}` : ''}</span>
                <span><b>Quantity:</b> {request.quantity || 'Not specified'} · <b>Delivery:</b> {formatDate(request.delivery_date)}</span>
                <span><b>Location:</b> {request.event_location || 'Not provided'}</span>
                <span>{request.notes || 'No organizer notes.'}</span>
                {request.clarification_note && <span><b>Clarification:</b> {request.clarification_note}</span>}
                <textarea
                  className="inline-textarea"
                  placeholder="Clarification note to organizer"
                  value={clarifications[request.id] || ''}
                  onChange={(event) => setClarifications({ ...clarifications, [request.id]: event.target.value })}
                />
                <div className="inline-actions">
                  {request.status === 'Pending' && (
                    <>
                      <button type="button" onClick={() => reviewRequest(request.id, 'Accepted')}>Accept</button>
                      <button className="danger-button" type="button" onClick={() => reviewRequest(request.id, 'Declined')}>Decline</button>
                    </>
                  )}
                  <button className="secondary-button" type="button" onClick={() => saveClarification(request.id)}>Save Note</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      {activePage === 'vendor-deliveries' && (
        <section className="page-panel">
          <div className="panel-header"><h2>Deliveries</h2><span>{deliveries.length}</span></div>
          {deliveries.length === 0 ? (
            <p className="empty-state">Accepted requests will appear here as deliveries.</p>
          ) : (
            <ul className="list data-list vendor-work-list">
              {deliveries.map((delivery) => (
                <li key={delivery.id}>
                  <strong>{delivery.requested_items}</strong>
                  <span>{delivery.event_name} · {delivery.status}</span>
                  <span><b>Event date:</b> {formatDateOnly(delivery.event_date)}</span>
                  <span><b>Quantity:</b> {delivery.quantity || 'Not specified'}</span>
                  <span><b>Location:</b> {delivery.event_location || 'Not provided'}</span>
                  <span><b>Scheduled:</b> {formatDate(delivery.scheduled_arrival)}</span>
                  <span><b>Delivered:</b> {delivery.arrived_at ? formatDate(delivery.arrived_at) : 'Not confirmed'}</span>
                  {delivery.status === 'Delivered' && (
                    <span className="review-status good-status">Delivery confirmed.</span>
                  )}
                  {delivery.status === 'Delayed' && delivery.confirmation_notes && (
                    <span><b>Delay reason:</b> {delivery.confirmation_notes}</span>
                  )}
                  <textarea
                    className="inline-textarea"
                    placeholder={delivery.status === 'Delayed' ? 'Delay reason for organizer' : 'Schedule change or confirmation note'}
                    value={deliveryNotes[delivery.id] || ''}
                    onChange={(event) => setDeliveryNotes({ ...deliveryNotes, [delivery.id]: event.target.value })}
                  />
                  <select value={delivery.status} onChange={(event) => updateDelivery(delivery.id, event.target.value)}>
                    {deliveryStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activePage === 'vendor-invoices' && (
        <>
        <section className="page-panel">
          <div className="panel-header"><h2>Invoice Notifications</h2><span>{invoiceNotifications.length}</span></div>
          {invoiceNotifications.length === 0 ? (
            <p className="empty-state">Reviewed or approved invoice notifications will appear here.</p>
          ) : (
            <ul className="list data-list invoice-list">
              {invoiceNotifications.map((invoice) => (
                <li key={invoice.id}>
                  <strong>{invoice.invoice_number || `Invoice #${invoice.id}`}</strong>
                  <span className={`review-status ${invoice.status === 'Rejected' ? 'bad-status' : 'good-status'}`}>
                    {invoice.status === 'Paid'
                      ? 'Payment notification: invoice marked as paid.'
                      : invoice.status === 'Approved'
                        ? 'Review notification: invoice approved.'
                        : 'Review notification: invoice rejected.'}
                  </span>
                  <span>{invoice.event_name} · {formatMoney(invoice.amount)}</span>
                  <span><b>Reviewed:</b> {invoice.reviewed_at ? formatDate(invoice.reviewed_at) : 'Review time not recorded'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Submit Invoice</h2></div>
          <form className="form compact-form" onSubmit={submitInvoice}>
            <label>
              Delivery
              <select
                value={invoiceForm.delivery_id}
                onChange={(event) => setInvoiceForm({ ...invoiceForm, delivery_id: event.target.value })}
                disabled={invoiceableDeliveries.length === 0}
                required={invoiceableDeliveries.length > 0}
              >
                <option value="">Choose delivered delivery</option>
                {invoiceableDeliveries.map((delivery) => (
                  <option key={delivery.id} value={delivery.id}>{delivery.event_name} · {delivery.requested_items} · {formatDateOnly(delivery.event_date)}</option>
                ))}
              </select>
              {invoiceableDeliveries.length === 0 && (
                <span className="field-help">No deliveries are ready for a new invoice. A delivery must be Delivered and must not already have an invoice.</span>
              )}
            </label>
            <label>
              Invoice number
              <input value={invoiceForm.invoice_number} onChange={(event) => setInvoiceForm({ ...invoiceForm, invoice_number: event.target.value })} required />
            </label>
            <label>
              Amount
              <input type="number" min="1" value={invoiceForm.amount} onChange={(event) => setInvoiceForm({ ...invoiceForm, amount: event.target.value })} required />
            </label>
            <label>
              Itemized breakdown
              <textarea value={invoiceForm.itemized_breakdown} onChange={(event) => setInvoiceForm({ ...invoiceForm, itemized_breakdown: event.target.value })} required />
            </label>
            <label>
              Supporting document
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(event) => setInvoiceForm({ ...invoiceForm, supporting_document_file: event.target.files?.[0] || null })}
              />
              <span className="field-help">Optional PDF, PNG, JPG, or JPEG. Maximum size: 5MB.</span>
            </label>
            <button type="submit" disabled={invoiceableDeliveries.length === 0}>Submit Invoice</button>
          </form>
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Delivery Invoice Readiness</h2><span>{deliveries.length}</span></div>
          {deliveries.length === 0 ? (
            <p className="empty-state">Accepted deliveries will appear here.</p>
          ) : (
            <ul className="list data-list">
              {deliveries.map((delivery) => {
                const readiness = getInvoiceReadiness(delivery)

                return (
                  <li key={delivery.id}>
                    <strong>{delivery.event_name} · {delivery.requested_items}</strong>
                    <span><b>Delivery status:</b> {delivery.status}</span>
                    <span><b>Event date:</b> {formatDateOnly(delivery.event_date)}</span>
                    <span className={`review-status ${readiness.className}`}>{readiness.text}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

      <section className="page-panel">
        <div className="panel-header"><h2>Invoices</h2><span>{invoices.length}</span></div>
        {invoices.length === 0 ? (
          <p className="empty-state">No invoices submitted yet.</p>
        ) : (
          <ul className="list data-list invoice-list">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <strong>{invoice.invoice_number || `Invoice #${invoice.id}`}</strong>
                <span>{invoice.event_name} · {invoice.requested_items}</span>
                <span><b>Event date:</b> {formatDateOnly(invoice.event_date)}</span>
                <span>{formatMoney(invoice.amount)} · {invoice.status}</span>
                <span className={`review-status ${invoice.status === 'Rejected' ? 'bad-status' : invoice.status === 'Pending Review' ? 'warning-status' : 'good-status'}`}>
                  {getInvoiceStatusMessage(invoice.status)}
                </span>
                <span>{invoice.itemized_breakdown || 'No itemized breakdown.'}</span>
                <span><b>Submitted:</b> {invoice.submitted_at ? formatDate(invoice.submitted_at) : 'Not submitted'}</span>
                <span><b>Reviewed:</b> {invoice.reviewed_at ? formatDate(invoice.reviewed_at) : 'Not reviewed yet'}</span>
                {invoice.supporting_document_url?.startsWith('http') ? (
                  <a href={getDocumentHref(invoice.supporting_document_url)} target="_blank" rel="noreferrer">View supporting document</a>
                ) : invoice.supporting_document_url?.startsWith('/uploads/') ? (
                  <a href={getDocumentHref(invoice.supporting_document_url)} target="_blank" rel="noreferrer">View supporting document</a>
                ) : invoice.supporting_document_url ? (
                  <span><b>Document reference:</b> {invoice.supporting_document_url}</span>
                ) : (
                  <span>No supporting document provided.</span>
                )}
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

export default VendorWorkspace
