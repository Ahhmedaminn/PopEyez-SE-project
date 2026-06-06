import { useState } from 'react'
import { apiPost } from '../api'

const roles = ['organizer', 'staff', 'vendor', 'guest', 'venueOwner']

function Register({ onRegister, onShowLogin }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'organizer',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const createdUser = await apiPost('/users', {
        full_name: formData.fullName,
        email: formData.email,
        password_hash: formData.password,
        role: formData.role,
        status: 'Active',
      })

      if (createdUser.role !== 'organizer') {
        setSuccess('Account created. This workspace is currently implemented for Event Organizers only.')
        return
      }

      onRegister(createdUser)
    } catch (err) {
      setError(err.message || 'Could not register this account. Try another email or check the backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-panel auth-panel">
      <div className="section-heading">
        <p className="eyebrow">Account creation</p>
        <h1>Register</h1>
        <p>Create a stakeholder account for the PopEyez platform.</p>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input
            type="text"
            value={formData.fullName}
            onChange={(event) => updateField('fullName', event.target.value)}
            placeholder="Mariam Hassan"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={formData.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="name@popeyez.demo"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={formData.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="Create password"
            required
          />
        </label>

        <label>
          Role
          <select value={formData.role} onChange={(event) => updateField('role', event.target.value)}>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {success && <p className="status-message">{success}</p>}

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" className="link-button" onClick={onShowLogin}>
          Login
        </button>
      </p>
    </section>
  )
}

export default Register
