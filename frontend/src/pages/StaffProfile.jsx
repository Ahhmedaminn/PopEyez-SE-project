import { useEffect, useState } from 'react'
import { apiGet } from '../api'

function StaffProfile({ currentUser }) {
  const [profile, setProfile] = useState(currentUser)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      try {
        const data = await apiGet(`/users/${currentUser.id}`)

        if (!ignore) {
          setProfile(data)
          setMessage('')
        }
      } catch (err) {
        if (!ignore) {
          setMessage(err.message || 'Could not refresh staff profile.')
        }
      }
    }

    loadProfile()

    return () => {
      ignore = true
    }
  }, [currentUser.id])

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Profile access</p>
        <h1>My Staff Profile</h1>
        <p>Profile details provided by the organizer for event operations.</p>
      </div>

      {message && <p className="error-text">{message}</p>}

      <section className="page-panel">
        <div className="panel-header">
          <h2>{profile.full_name}</h2>
          <span>{profile.status}</span>
        </div>
        <ul className="list">
          <li><strong>Email</strong><span>{profile.email}</span></li>
          <li><strong>Role</strong><span>{profile.role}</span></li>
          <li><strong>Phone</strong><span>{profile.phone || 'No phone saved'}</span></li>
          <li><strong>Age</strong><span>{profile.age || 'No age saved'}</span></li>
          <li><strong>Speciality</strong><span>{profile.speciality || 'No speciality saved'}</span></li>
          <li><strong>Employment type</strong><span>{profile.employment_type || 'No employment type saved'}</span></li>
        </ul>
      </section>
    </div>
  )
}

export default StaffProfile
