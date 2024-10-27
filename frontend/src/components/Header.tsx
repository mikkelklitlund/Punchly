import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Header() {
  const { isAuthenticated, user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    // Optionally redirect to login page
  }

  return (
    <header>
      <nav>
        {isAuthenticated ? (
          <>
            <span>Welcome, {user?.username}</span>
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
