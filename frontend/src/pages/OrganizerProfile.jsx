import { useState } from 'react'
import { apiPut } from '../api'

function OrganizerProfile({ currentUser, onUserUpdated }) {
  const [form, setForm] = useState({
    full_name: currentUser.full_name || '',
    email: currentUser.email || '',
    password_hash: '',
    phone: currentUser.phone || '',
    age: currentUser.age || '',
    company_name: currentUser.company_name || '',
  })
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const updatedUser = await apiPut(`/users/${currentUser.id}`, {
        full_name: form.full_name,
        email: form.email,
        password_hash: form.password_hash || null,
        phone: form.phone || null,
        age: form.age || null,
        company_name: form.company_name || null,
        actor_id: currentUser.id,
      })
      onUserUpdated(updatedUser)
      setForm((current) => ({ ...current, password_hash: '' }))
      setMessage('Profile updated.')
    } catch (err) {
      setMessage(err.message || 'Could not update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Account customization</p>
        <h1>My Organizer Profile</h1>
        <p>Review and update your own account details.</p>
      </div>

      {message && <p className={message === 'Profile updated.' ? 'status-message' : 'error-text'}>{message}</p>}

      <section className="page-panel auth-panel">
        <form className="form" onSubmit={saveProfile}>
          <label>
            Full name
            <input value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
          </label>
          <label>
            New password
            <input type="password" value={form.password_hash} onChange={(event) => updateField('password_hash', event.target.value)} placeholder="Leave blank to keep current password" />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          </label>
          <label>
            Age
            <input type="number" min="18" value={form.age} onChange={(event) => updateField('age', event.target.value)} />
          </label>
          <label>
            Company name
            <input value={form.company_name} onChange={(event) => updateField('company_name', event.target.value)} />
          </label>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
        </form>
      </section>
    </div>
  )
}

export default OrganizerProfile
