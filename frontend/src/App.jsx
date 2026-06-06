import { useState } from 'react'
import './App.css'
import BudgetExpenses from './pages/BudgetExpenses'
import EventsTasks from './pages/EventsTasks'
import GuestManagement from './pages/GuestManagement'
import Login from './pages/Login'
import OperationsReports from './pages/OperationsReports'
import OrganizerDashboard from './pages/OrganizerDashboard'
import Register from './pages/Register'
import UserManagement from './pages/UserManagement'
import VendorCoordination from './pages/VendorCoordination'
import VenuesBooking from './pages/VenuesBooking'

const storedUserKey = 'popeyezCurrentUser'

const organizerPages = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'events', label: 'Events & Tasks' },
  { id: 'finance', label: 'Budget' },
  { id: 'venues', label: 'Venues' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'guests', label: 'Guests' },
  { id: 'operations', label: 'Operations' },
]

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem(storedUserKey)
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [activePage, setActivePage] = useState(currentUser?.role === 'organizer' ? 'dashboard' : 'login')

  function handleLogin(user) {
    setCurrentUser(user)
    localStorage.setItem(storedUserKey, JSON.stringify(user))
    setActivePage('dashboard')
  }

  function handleLogout() {
    setCurrentUser(null)
    localStorage.removeItem(storedUserKey)
    setActivePage('login')
  }

  function renderPage() {
    if (activePage === 'login') {
      return <Login onLogin={handleLogin} onShowRegister={() => setActivePage('register')} />
    }

    if (activePage === 'register') {
      return <Register onRegister={handleLogin} onShowLogin={() => setActivePage('login')} />
    }

    if (!currentUser) {
      return <Login onLogin={handleLogin} onShowRegister={() => setActivePage('register')} />
    }

    if (currentUser.role !== 'organizer') {
      return (
        <section className="page-panel notice-panel">
          <p className="eyebrow">Role unavailable</p>
          <h1>Organizer Workspace Only</h1>
          <p>This frontend workspace is currently implemented for the Event Organizer demo only.</p>
          <button type="button" onClick={handleLogout}>Return to Login</button>
        </section>
      )
    }

    if (activePage === 'users') {
      return <UserManagement />
    }

    if (activePage === 'events') {
      return <EventsTasks currentUser={currentUser} />
    }

    if (activePage === 'finance') {
      return <BudgetExpenses />
    }

    if (activePage === 'venues') {
      return <VenuesBooking currentUser={currentUser} />
    }

    if (activePage === 'vendors') {
      return <VendorCoordination currentUser={currentUser} />
    }

    if (activePage === 'guests') {
      return <GuestManagement currentUser={currentUser} />
    }

    if (activePage === 'operations') {
      return <OperationsReports currentUser={currentUser} />
    }

    return <OrganizerDashboard />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="brand-kicker">PopEyez</p>
          <strong>Event Management Platform</strong>
        </div>

        <nav>
          {currentUser?.role === 'organizer' ? (
            <>
              {organizerPages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className={activePage === page.id ? 'active' : ''}
                  onClick={() => setActivePage(page.id)}
                >
                  {page.label}
                </button>
              ))}
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : currentUser ? (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <button type="button" className={activePage === 'login' ? 'active' : ''} onClick={() => setActivePage('login')}>
                Login
              </button>
              <button type="button" className={activePage === 'register' ? 'active' : ''} onClick={() => setActivePage('register')}>
                Register
              </button>
            </>
          )}
        </nav>
      </header>

      {currentUser && (
        <div className="session-bar">
          Logged in as <strong>{currentUser.full_name}</strong> · {currentUser.role}
        </div>
      )}

      <main>{renderPage()}</main>
    </div>
  )
}

export default App
