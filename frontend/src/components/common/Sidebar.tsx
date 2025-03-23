import { Department, Role } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { House, Users, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useDepartments } from '../../hooks/useDepartments'

function Sidebar() {
  const { role, companyId, logout } = useAuth()
  const { departments, fetchDepartments, setCurrentDepartment, currentDepartment } = useDepartments()
  const [showSubMenu, setShowSubMenu] = useState(false)
  const location = useLocation()
  const isSelected = (dep: Department | undefined) => location.pathname === '/' && currentDepartment === dep

  useEffect(() => {
    const getDepartments = async () => {
      if (companyId) await fetchDepartments(companyId)
    }
    getDepartments()
  }, [companyId])

  if (!role || role === Role.COMPANY) return null

  const menuItems = [
    { label: 'Medarbejdere', href: '/employees', icon: Users, roles: [Role.ADMIN, Role.MANAGER] },
    { label: 'Managere', href: '/managers', icon: Users, roles: [Role.ADMIN] },
    { label: 'Indstillinger', href: '/settings', icon: Settings, roles: [Role.ADMIN, Role.MANAGER] },
  ]

  return (
    <aside className="bg-burnt flex min-h-screen w-[12rem] max-w-56 flex-col p-4 text-white">
      <nav className="flex h-full flex-col justify-between">
        <ul className="grow space-y-4">
          <li className="border-mustard border-b-2">
            <p className="text-3xl font-bold">Punchly</p>
          </li>
          <li>
            <button
              className="hover:bg-mustard flex w-full flex-col rounded-md p-2"
              onClick={(e) => {
                e.stopPropagation()
                setShowSubMenu((prev) => !prev)
              }}
              aria-expanded={showSubMenu}
            >
              <div className="flex w-full items-center gap-2">
                <House />
                <span>Oversigt</span>
                {showSubMenu ? <ChevronUp /> : <ChevronDown />}
              </div>

              <div
                className={`flex flex-col items-start overflow-hidden pl-6 transition-all duration-300 ${
                  showSubMenu ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {departments.map((department) => (
                  <Link
                    key={department.id}
                    to={'/'}
                    className={`text-neutral-200 transition duration-150 ${
                      isSelected(department) ? 'text-neutral-800 underline underline-offset-2' : 'hover:text-black'
                    }`}
                    onClick={() => setCurrentDepartment(department)}
                  >
                    {department.name}
                  </Link>
                ))}
                <Link
                  to={'/'}
                  className={`text-neutral-200 transition duration-150 ${
                    isSelected(undefined) ? 'text-neutral-800 underline underline-offset-2' : 'hover:text-black'
                  }`}
                  onClick={() => setCurrentDepartment(undefined)}
                >
                  Samlet
                </Link>
              </div>
            </button>
          </li>
          {menuItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="hover:bg-mustard flex gap-2 rounded-md p-2"
                  onClick={() => setShowSubMenu(false)}
                >
                  <item.icon />
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>

        <ul>
          <li>
            <button onClick={logout} className="bg-mustard hover:bg-burnt w-full rounded-sm px-4 py-1 text-white">
              Log ud
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
