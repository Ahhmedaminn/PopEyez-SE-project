import { useState } from 'react'
import { apiGet } from '../api'

function Login({ onLogin, onShowRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const users = await apiGet('/users')
      const user = users.find((currentUser) => currentUser.email.toLowerCase() === email.toLowerCase())

      if (!password.trim()) {
        setError('Please enter a password.')
        return
      }

      if (!user) {
        setError('Account not found. Please register first.')
        return
      }

      if (user.password_hash && user.password_hash !== password) {
        setError('Incorrect password.')
        return
      }

      if (user.status !== 'Active') {
        setError('This account is deactivated. Please contact the organizer.')
        return
      }

      if (user.role !== 'organizer') {
        setError('This workspace is currently implemented for Event Organizers only.')
        return
      }

      onLogin(user)
    } catch (err) {
      setError(err.message || 'Could not log in. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-panel auth-panel">
      <div className="section-heading">
        <p className="eyebrow">Shared system</p>
        <h1>Login</h1>
        <p>Sign in to open your PopEyez workspace.</p>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <p className="mvp-note">MVP login: password is checked against the demo database value, not securely authenticated yet.</p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="mariam.organizer@popeyez.demo"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      <p className="auth-switch">
        No account yet?{' '}
        <button type="button" className="link-button" onClick={onShowRegister}>
          Register
        </button>
      </p>
    </section>
  )
}

export default Login
