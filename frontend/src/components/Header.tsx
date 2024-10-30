import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Header() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    // Optionally redirect to login page
  }

  return (
    <header>
      <nav>
        {user ? (
          <>
            <span>Welcome, {user}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
    </header>
  )
}

export default Header
