import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext' // Adjust the path as necessary

const Header = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <>
      {location.pathname !== '/login' && (
        <header className="bg-gray-300 p-4 text-cream fixed top-0 left-0 w-full shadow-md">
          <div className="flex justify-between items-center">
            <nav className="flex space-x-4">
              <a href="/" className="hover:text-mustard text-zinc-700 font-bold">
                Home
              </a>
              <a href="/about" className="hover:text-mustard text-zinc-700 font-bold">
                About
              </a>
              <a href="/contact" className="hover:text-mustard text-zinc-700 font-bold">
                Contact
              </a>
            </nav>
            <div>
              {user ? (
                <button onClick={logout} className="bg-mustard hover:bg-burnt text-white py-1 px-4 rounded">
                  Logout
                </button>
              ) : (
                <button className="bg-mustard hover:bg-burnt text-white py-1 px-4 rounded">
                  <a href="/login">Login</a>
                </button>
              )}
            </div>
          </div>
        </header>
      )}
    </>
  )
}

export default Header
