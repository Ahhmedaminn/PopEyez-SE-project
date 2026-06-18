import { useState } from 'react'
import './App.css'
import BudgetExpenses from './pages/BudgetExpenses'
import EventsTasks from './pages/EventsTasks'
import GuestManagement from './pages/GuestManagement'
import GuestWorkspace from './pages/GuestWorkspace'
import Login from './pages/Login'
import OperationsReports from './pages/OperationsReports'
import OrganizerDashboard from './pages/OrganizerDashboard'
import OrganizerProfile from './pages/OrganizerProfile'
import Register from './pages/Register'
import StaffDashboard from './pages/StaffDashboard'
import StaffEvents from './pages/StaffEvents'
import StaffLayouts from './pages/StaffLayouts'
import StaffOperations from './pages/StaffOperations'
import StaffProfile from './pages/StaffProfile'
import StaffTasks from './pages/StaffTasks'
import UserManagement from './pages/UserManagement'
import OrganizerLayouts from './pages/OrganizerLayouts'
import VendorCoordination from './pages/VendorCoordination'
import VendorWorkspace from './pages/VendorWorkspace'
import VenueOwnerWorkspace from './pages/VenueOwnerWorkspace'
import VenuesBooking from './pages/VenuesBooking'

const storedUserKey = 'popeyezCurrentUser'

const organizerPages = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'organizer-profile', label: 'Profile' },
  { id: 'users', label: 'Users' },
  { id: 'events', label: 'Events & Tasks' },
  { id: 'finance', label: 'Budget' },
  { id: 'venues', label: 'Venues' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'guests', label: 'Guests' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'operations', label: 'Operations' },
]

const staffPages = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profile', label: 'Profile' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'staff-events', label: 'Events' },
  { id: 'staff-layouts', label: 'Layouts' },
  { id: 'staff-operations', label: 'Operations' },
]

const vendorPages = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'vendor-profile', label: 'Profile' },
  { id: 'vendor-requests', label: 'Requests' },
  { id: 'vendor-deliveries', label: 'Deliveries' },
  { id: 'vendor-invoices', label: 'Invoices' },
]

const guestPages = [
  { id: 'guest-dashboard', label: 'Dashboard' },
  { id: 'guest-invitations', label: 'Invitations' },
  { id: 'guest-rsvp', label: 'RSVP' },
  { id: 'guest-messages', label: 'Messages' },
  { id: 'guest-checkin', label: 'Check-In' },
  { id: 'guest-feedback', label: 'Feedback' },
]

const venueOwnerPages = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'venue-owner-profile', label: 'Profile' },
  { id: 'venue-listings', label: 'Listings' },
  { id: 'venue-booking-requests', label: 'Requests' },
  { id: 'venue-confirmed-bookings', label: 'Confirmed Bookings' },
  { id: 'venue-performance', label: 'Reports' },
]

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem(storedUserKey)
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [activePage, setActivePage] = useState(
    currentUser?.role === 'guest'
      ? 'guest-dashboard'
      : ['organizer', 'staff', 'vendor', 'venueOwner'].includes(currentUser?.role) ? 'dashboard' : 'login'
  )

  function handleLogin(user) {
    setCurrentUser(user)
    localStorage.setItem(storedUserKey, JSON.stringify(user))
    setActivePage(user.role === 'guest' ? 'guest-dashboard' : 'dashboard')
  }

  function handleLogout() {
    setCurrentUser(null)
    localStorage.removeItem(storedUserKey)
    setActivePage('login')
  }

  function handleUserUpdated(user) {
    setCurrentUser(user)
    localStorage.setItem(storedUserKey, JSON.stringify(user))
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

    if (currentUser.role === 'staff') {
      if (activePage === 'profile') {
        return <StaffProfile currentUser={currentUser} />
      }

      if (activePage === 'tasks') {
        return <StaffTasks currentUser={currentUser} />
      }

      if (activePage === 'staff-events') {
        return <StaffEvents currentUser={currentUser} />
      }

      if (activePage === 'staff-layouts') {
        return <StaffLayouts currentUser={currentUser} />
      }

      if (activePage === 'staff-operations') {
        return <StaffOperations currentUser={currentUser} />
      }

      return <StaffDashboard currentUser={currentUser} />
    }

    if (currentUser.role === 'vendor') {
      return <VendorWorkspace currentUser={currentUser} activePage={activePage} />
    }

    if (currentUser.role === 'guest') {
      return <GuestWorkspace currentUser={currentUser} activePage={activePage} />
    }

    if (currentUser.role === 'venueOwner') {
      return <VenueOwnerWorkspace currentUser={currentUser} activePage={activePage} onUserUpdated={handleUserUpdated} />
    }

    if (currentUser.role !== 'organizer') {
      return (
        <section className="page-panel notice-panel">
          <p className="eyebrow">Role unavailable</p>
          <h1>Workspace Unavailable</h1>
          <p>This frontend workspace is currently implemented for Event Organizers, Staff, Vendors, Guests, and Venue Owners only.</p>
          <button type="button" onClick={handleLogout}>Return to Login</button>
        </section>
      )
    }

    if (activePage === 'users') {
      return <UserManagement currentUser={currentUser} />
    }

    if (activePage === 'organizer-profile') {
      return <OrganizerProfile currentUser={currentUser} onUserUpdated={handleUserUpdated} />
    }

    if (activePage === 'events') {
      return <EventsTasks currentUser={currentUser} />
    }

    if (activePage === 'finance') {
      return <BudgetExpenses currentUser={currentUser} />
    }

    if (activePage === 'venues') {
      return <VenuesBooking currentUser={currentUser} />
    }

    if (activePage === 'vendors') {
      return <VendorCoordination currentUser={currentUser} />
    }

    if (activePage === 'layouts') {
      return <OrganizerLayouts currentUser={currentUser} />
    }

    if (activePage === 'guests') {
      return <GuestManagement currentUser={currentUser} />
    }

    if (activePage === 'operations') {
      return <OperationsReports currentUser={currentUser} />
    }

    return <OrganizerDashboard currentUser={currentUser} />
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
                  className={`nav-button ${activePage === page.id ? 'active' : ''}`}
                  onClick={() => setActivePage(page.id)}
                >
                  {page.label}
                </button>
              ))}
              <button type="button" className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : currentUser?.role === 'staff' ? (
            <>
              {staffPages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className={`nav-button ${activePage === page.id ? 'active' : ''}`}
                  onClick={() => setActivePage(page.id)}
                >
                  {page.label}
                </button>
              ))}
              <button type="button" className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : currentUser?.role === 'vendor' ? (
            <>
              {vendorPages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className={`nav-button ${activePage === page.id ? 'active' : ''}`}
                  onClick={() => setActivePage(page.id)}
                >
                  {page.label}
                </button>
              ))}
              <button type="button" className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : currentUser?.role === 'guest' ? (
            <>
              {guestPages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className={`nav-button ${activePage === page.id ? 'active' : ''}`}
                  onClick={() => setActivePage(page.id)}
                >
                  {page.label}
                </button>
              ))}
              <button type="button" className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : currentUser?.role === 'venueOwner' ? (
            <>
              {venueOwnerPages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  className={`nav-button ${activePage === page.id ? 'active' : ''}`}
                  onClick={() => setActivePage(page.id)}
                >
                  {page.label}
                </button>
              ))}
              <button type="button" className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : currentUser ? (
            <button type="button" className="logout-button" onClick={handleLogout}>
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
