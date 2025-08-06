import { useAuth } from '../../contexts/AuthContext'
import { useCompany } from '../../contexts/CompanyContext'

function Header() {
  const { logout } = useAuth()
  const { departments, setCurrentDepartment, currentDepartment } = useCompany()

  return (
    <header className="text-cream bg-burnt h-16 w-full p-4 shadow-md">
      <div className="flex h-full items-center justify-between">
        <nav className="flex space-x-4">
          {departments.map((department) => (
            <button
              className={`font-bold transition duration-150 ${
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
            className={`font-bold transition duration-150 ${currentDepartment?.id === undefined ? 'scale-110 underline underline-offset-2' : 'hover:text-mustard'}`}
            onClick={() => setCurrentDepartment(undefined)}
          >
            Samlet
          </button>
        </nav>

        <button onClick={logout} className="bg-rust hover:bg-rust/80 rounded-sm px-4 py-1 text-white">
          Log ud
        </button>
      </div>
    </header>
  )
}

export default Header
