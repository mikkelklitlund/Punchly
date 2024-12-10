import { useAuth } from '../contexts/AuthContext'
import { useAppContext } from '../contexts/AppContext'
import { useEffect } from 'react'

function Header() {
  const { user, logout, companyId } = useAuth()
  const { departments, fetchDepartments, setCurrentDepartment, currentDepartment } = useAppContext()

  useEffect(() => {
    const getDepartments = async () => {
      if (companyId) await fetchDepartments(companyId)
    }
    getDepartments()
  }, [companyId])

  return (
    <header className="bg-gray-300 p-4 text-cream fixed top-0 left-0 w-full shadow-md h-16 z-10">
      <div className="flex justify-between items-center h-full">
        <nav className="flex space-x-4">
          {departments.map((department) => (
            <button
              className={`text-zinc-700 font-bold transition duration-150 
                ${
                  currentDepartment?.id === department.id
                    ? 'underline underline-offset-2 scale-110'
                    : 'hover:text-mustard'
                }`}
              key={department.id}
              onClick={() => setCurrentDepartment(department)}
            >
              {department.name}
            </button>
          ))}
        </nav>
        <div>
          {user ? (
            <button onClick={logout} className="bg-mustard hover:bg-burnt text-white py-1 px-4 rounded">
              Log ud
            </button>
          ) : (
            <button className="bg-mustard hover:bg-burnt text-white py-1 px-4 rounded">
              <a href="/login">Log ind</a>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
