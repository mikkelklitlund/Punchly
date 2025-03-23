import { Department, Role } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { House, Users, Settings, ChevronDown, ChevronUp, LogOut } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useCompany } from '../../contexts/CompanyContext'

function Sidebar() {
  const { role, logout } = useAuth()
  const { departments, setCurrentDepartment, currentDepartment } = useCompany()
  const [showSubMenu, setShowSubMenu] = useState(false)
  const location = useLocation()
  const isSelected = (dep: Department | undefined) => location.pathname === '/' && currentDepartment === dep

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
          <li className="border-mustard border-b-2 pb-2">
            <p className="text-3xl font-bold">Punchly</p>
          </li>
          <li>
            <button
              className="hover:bg-mustard flex w-full flex-col rounded-md p-2 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation()
                setShowSubMenu((prev) => !prev)
              }}
              aria-expanded={showSubMenu}
            >
              <div className="flex w-full items-center gap-2">
                <House className="text-cream" />
                <span>Oversigt</span>
                {showSubMenu ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
              </div>

              <div
                className={`flex flex-col justify-items-start space-y-2 overflow-hidden pl-6 transition-all duration-300 ${
                  showSubMenu ? 'max-h-96 pt-2 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {departments.map((department) => (
                  <Link
                    key={department.id}
                    to={'/'}
                    className={`w-full rounded px-2 py-1 text-left text-sm transition duration-150 ${
                      isSelected(department)
                        ? 'bg-mustard/20 text-cream font-medium'
                        : 'hover:bg-mustard/10 hover:text-cream text-neutral-200'
                    }`}
                    onClick={() => setCurrentDepartment(department)}
                  >
                    {department.name}
                  </Link>
                ))}
                <Link
                  to={'/'}
                  className={`w-full rounded px-2 py-1 text-left text-sm transition duration-150 ${
                    isSelected(undefined)
                      ? 'bg-mustard/20 text-cream font-medium'
                      : 'hover:bg-mustard/10 hover:text-cream text-neutral-200'
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
                  className={`hover:bg-mustard flex items-center gap-2 rounded-md p-2 transition-colors duration-200 ${
                    location.pathname === item.href ? 'bg-mustard/20' : ''
                  }`}
                  onClick={() => setShowSubMenu(false)}
                >
                  <item.icon className="text-cream" />
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>

        <ul className="border-mustard/30 border-t pt-4">
          <li>
            <button
              onClick={logout}
              className="bg-rust hover:bg-rust/80 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-medium text-white transition-colors duration-200"
            >
              <LogOut size={16} />
              Log ud
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
