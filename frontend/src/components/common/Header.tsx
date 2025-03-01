import { useAppContext } from '../../contexts/AppContext'
import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'

function Header() {
  const { logout, companyId } = useAuth()
  const { departments, fetchDepartments, setCurrentDepartment, currentDepartment } = useAppContext()

  useEffect(() => {
    const getDepartments = async () => {
      if (companyId) await fetchDepartments(companyId)
    }
    getDepartments()
  }, [companyId])

  return (
    <header className="text-cream fixed left-0 top-0 z-10 h-16 w-full bg-gray-300 p-4 shadow-md">
      <div className="flex h-full items-center justify-between">
        <nav className="flex space-x-4">
          {departments.map((department) => (
            <button
              className={`font-bold text-zinc-700 transition duration-150 ${
                currentDepartment?.id === department.id
                  ? 'scale-110 underline underline-offset-2'
                  : 'hover:text-mustard'
              }`}
              key={department.id}
              onClick={() => setCurrentDepartment(department)}
            >
              {department.name}
            </button>
          ))}
          <button
            className={`font-bold text-zinc-700 transition duration-150 ${currentDepartment?.id === undefined ? 'scale-110 underline underline-offset-2' : 'hover:text-mustard'}`}
            onClick={() => setCurrentDepartment(undefined)}
          >
            Samlet
          </button>
        </nav>

        <button onClick={logout} className="rounded bg-mustard px-4 py-1 text-white hover:bg-burnt">
          Log ud
        </button>
      </div>
    </header>
  )
}

export default Header
