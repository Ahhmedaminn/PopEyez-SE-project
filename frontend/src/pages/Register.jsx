import { useState } from 'react'
import { apiPost, apiPut } from '../api'

const roles = ['organizer', 'vendor', 'guest', 'venueOwner']

function Register({ onRegister, onShowLogin }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'organizer',
    phone: '',
    age: '',
    companyName: '',
    suppliesOffered: '',
    mainLocation: '',
    pricingList: '',
    venueName: '',
    venueDescription: '',
    venueLocation: '',
    venueCity: '',
    venueCapacity: '',
    venueDimensions: '',
    venueAmenities: '',
    venueDailyPrice: '',
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
        phone: formData.phone || null,
        age: formData.age || null,
        company_name: formData.companyName || null,
        status: 'Active',
      })

      if (createdUser.role === 'vendor') {
        await apiPut(`/vendors/by-user/${createdUser.id}`, {
          company_name: formData.companyName,
          supplies_offered: formData.suppliesOffered,
          main_location: formData.mainLocation || null,
          pricing_list: formData.pricingList || null,
          contact_email: formData.email,
          contact_phone: formData.phone || null,
        })
        onRegister(createdUser)
        return
      }

      if (createdUser.role === 'venueOwner') {
        await apiPost('/venues', {
          owner_id: createdUser.id,
          name: formData.venueName,
          description: formData.venueDescription || null,
          location: formData.venueLocation,
          city: formData.venueCity,
          capacity: formData.venueCapacity,
          dimensions_sqm: formData.venueDimensions || null,
          amenities: formData.venueAmenities || null,
          daily_price: formData.venueDailyPrice || null,
        })
        onRegister(createdUser)
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

        <label>
          Phone
          <input
            value={formData.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="+20 100 000 0000"
            required={formData.role === 'venueOwner'}
          />
        </label>

        <label>
          Age
          <input type="number" min="18" value={formData.age} onChange={(event) => updateField('age', event.target.value)} placeholder="Age" />
        </label>

        <label>
          Company name
          <input
            value={formData.companyName}
            onChange={(event) => updateField('companyName', event.target.value)}
            placeholder="Company or organization"
            required={formData.role === 'vendor' || formData.role === 'venueOwner'}
          />
        </label>

        {formData.role === 'vendor' && (
          <fieldset className="form-section">
            <legend>Vendor Profile</legend>
            <input value={formData.suppliesOffered} onChange={(event) => updateField('suppliesOffered', event.target.value)} placeholder="Supplies offered" required />
            <input value={formData.mainLocation} onChange={(event) => updateField('mainLocation', event.target.value)} placeholder="Main location" required />
            <input value={formData.pricingList} onChange={(event) => updateField('pricingList', event.target.value)} placeholder="Pricing list" required />
          </fieldset>
        )}

        {formData.role === 'venueOwner' && (
          <fieldset className="form-section">
            <legend>First Venue Details</legend>
            <input value={formData.venueName} onChange={(event) => updateField('venueName', event.target.value)} placeholder="Venue name" required />
            <textarea value={formData.venueDescription} onChange={(event) => updateField('venueDescription', event.target.value)} placeholder="Venue description" />
            <input value={formData.venueLocation} onChange={(event) => updateField('venueLocation', event.target.value)} placeholder="Full location" required />
            <input value={formData.venueCity} onChange={(event) => updateField('venueCity', event.target.value)} placeholder="City" required />
            <input type="number" min="1" value={formData.venueCapacity} onChange={(event) => updateField('venueCapacity', event.target.value)} placeholder="Capacity" required />
            <input type="number" min="1" value={formData.venueDimensions} onChange={(event) => updateField('venueDimensions', event.target.value)} placeholder="Dimensions in square metres" />
            <input value={formData.venueAmenities} onChange={(event) => updateField('venueAmenities', event.target.value)} placeholder="Amenities" />
            <input type="number" min="0" value={formData.venueDailyPrice} onChange={(event) => updateField('venueDailyPrice', event.target.value)} placeholder="Daily price" />
          </fieldset>
        )}

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
