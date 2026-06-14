/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api'

const visibleRoles = ['staff', 'vendor', 'guest', 'venueOwner']
const creatableRoles = ['staff', 'vendor', 'guest']
const statuses = ['Active', 'Deactivated']

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({ role: '', status: '', employment_type: '', speciality: '' })
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password_hash: '',
    role: 'staff',
    phone: '',
    age: '',
    speciality: '',
    employment_type: '',
    company_name: '',
  })

  async function loadUsers() {
    const params = new URLSearchParams()
    if (filters.role) params.set('role', filters.role)
    if (filters.status) params.set('status', filters.status)
    if (filters.employment_type) params.set('employment_type', filters.employment_type)
    if (filters.speciality) params.set('speciality', filters.speciality)
    params.set('created_by', currentUser.id)
    const data = await apiGet(`/users${params.toString() ? `?${params}` : ''}`)
    setUsers(data.filter((user) => user.role !== 'organizer'))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers().catch((err) => setMessage(err.message || 'Could not load users.'))
  }, [filters])

  function updateForm(field, value) {
    setForm((current) => {
      if (field !== 'role') {
        return { ...current, [field]: value }
      }

      return {
        ...current,
        role: value,
        speciality: '',
        employment_type: '',
        company_name: '',
      }
    })
  }

  async function createUser(event) {
    event.preventDefault()
    setMessage('')

    try {
      await apiPost('/users', {
        full_name: form.full_name,
        email: form.email,
        password_hash: form.password_hash,
        role: form.role,
        phone: form.phone || null,
        age: form.role === 'staff' || form.role === 'guest' ? form.age || null : null,
        speciality: form.role === 'staff' ? form.speciality || null : null,
        employment_type: form.role === 'staff' ? form.employment_type || null : null,
        company_name: form.role === 'vendor' ? form.company_name || null : null,
        created_by: currentUser.id,
        status: 'Active',
      })
      setForm({
        full_name: '',
        email: '',
        password_hash: '',
        role: 'staff',
        phone: '',
        age: '',
        speciality: '',
        employment_type: '',
        company_name: '',
      })
      setMessage('Stakeholder account created.')
      await loadUsers()
    } catch (err) {
      setMessage(err.message || 'Could not create stakeholder account.')
    }
  }

  async function updateStatus(user, status) {
    setMessage('')

    if (user.role === 'organizer' || user.id === currentUser.id) {
      setMessage('Organizer accounts and your own account are protected.')
      return
    }

    try {
      await apiPatch(`/users/${user.id}/status`, { status, organizer_id: currentUser.id })
      setMessage(`User ${status === 'Active' ? 'reactivated' : 'deactivated'}.`)
      await loadUsers()
    } catch (err) {
      setMessage(err.message || 'Could not update user status.')
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Account creation</p>
        <h1>User Management</h1>
        <p>Create stakeholder accounts, filter staff, and deactivate accounts when needed.</p>
      </div>

      {message && <p className={message.toLowerCase().includes('could not') ? 'error-text' : 'status-message'}>{message}</p>}

      <section className="page-panel">
        <div className="panel-header"><h2>Filters</h2></div>
        <div className="filter-row">
          <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All roles</option>
            {visibleRoles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={filters.employment_type} onChange={(e) => setFilters({ ...filters, employment_type: e.target.value })}>
            <option value="">All employment types</option>
            <option value="full-time">full-time</option>
            <option value="part-time">part-time</option>
          </select>
          <input placeholder="Speciality" value={filters.speciality} onChange={(e) => setFilters({ ...filters, speciality: e.target.value })} />
        </div>
      </section>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Stakeholders</h2><span>{users.length}</span></div>
          <ul className="list data-list">
            {users.map((user) => (
              <li key={user.id}>
                <strong>{user.full_name}</strong>
                <span>{user.email} · {user.role} · {user.status}</span>
                <span>{user.phone || 'No phone'} · {user.age || 'No age'} · {user.speciality || 'No speciality'}</span>
                <span>{user.employment_type || 'No employment type'} · {user.company_name || 'No company'}</span>
                {user.role === 'organizer' || user.id === currentUser.id ? (
                  <span className="protected-label">Protected account</span>
                ) : (
                  <button type="button" onClick={() => updateStatus(user, user.status === 'Active' ? 'Deactivated' : 'Active')}>
                    {user.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>Create Account</h2></div>
          <form className="form compact-form" onSubmit={createUser}>
            <input placeholder="Full name" value={form.full_name} onChange={(e) => updateForm('full_name', e.target.value)} required />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} required />
            <input type="password" placeholder="Temporary password" value={form.password_hash} onChange={(e) => updateForm('password_hash', e.target.value)} required />
            <select value={form.role} onChange={(e) => updateForm('role', e.target.value)}>
              {creatableRoles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <input placeholder="Phone" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />

            {(form.role === 'staff' || form.role === 'guest') && (
              <input type="number" min="0" placeholder="Age" value={form.age} onChange={(e) => updateForm('age', e.target.value)} />
            )}

            {form.role === 'staff' && (
              <>
                <input placeholder="Speciality" value={form.speciality} onChange={(e) => updateForm('speciality', e.target.value)} required />
                <select value={form.employment_type} onChange={(e) => updateForm('employment_type', e.target.value)} required>
                  <option value="">Employment type</option>
                  <option value="full-time">full-time</option>
                  <option value="part-time">part-time</option>
                </select>
              </>
            )}

            {form.role === 'vendor' && (
              <input placeholder="Company name" value={form.company_name} onChange={(e) => updateForm('company_name', e.target.value)} required />
            )}

            <button type="submit">Create Account</button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default UserManagement
