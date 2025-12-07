import { DepartmentDTO, Role } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { House, Users, Settings, ChevronDown, ChevronUp, LogOut, CalendarClock } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useCompany } from '../../contexts/CompanyContext'

function Sidebar() {
  const { role, logout } = useAuth()
  const { departments, setCurrentDepartment, currentDepartment } = useCompany()
  const [showSubMenuOverview, setShowSubMenuOverview] = useState(false)
  const [showSubMenuAttendance, setShowSubMenuAttendance] = useState(false)
  const location = useLocation()
  const isSelected = (dep: DepartmentDTO | undefined) => location.pathname === '/' && currentDepartment === dep

  if (!role || role === Role.COMPANY) return null

  const menuItems = [
    { label: 'Medarbejdere', href: '/employees', icon: Users, roles: [Role.ADMIN, Role.MANAGER] },
    { label: 'Brugere', href: '/users', icon: Users, roles: [Role.ADMIN] },
    { label: 'Indstillinger', href: '/settings', icon: Settings, roles: [Role.ADMIN] },
  ]

  return (
    <aside className="bg-burnt flex h-screen w-full max-w-56 flex-col text-white">
      <div className="flex h-full flex-col justify-between p-4">
        {/* Scrollable content */}
        <ul className="flex-1 space-y-4 overflow-y-auto pr-1">
          <li className="border-mustard border-b-2 pb-2">
            <Link to={'/'} className="text-3xl font-bold" onClick={() => setCurrentDepartment(undefined)}>
              Punchly
            </Link>
          </li>

          {/* Overview menu */}
          <li>
            <button
              className="hover:bg-mustard flex w-full flex-col rounded-md p-2 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation()
                setShowSubMenuOverview((prev) => !prev)
              }}
              aria-expanded={showSubMenuOverview}
            >
              <div className="flex w-full items-center gap-2">
                <House className="text-cream" />
                <span className="truncate" title="Oversigt">
                  Oversigt
                </span>
                {showSubMenuOverview ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
              </div>

              <div
                className={`flex flex-col justify-items-start space-y-2 overflow-hidden pl-6 transition-all duration-300 ${
                  showSubMenuOverview ? 'max-h-96 pt-2 opacity-100' : 'max-h-0 opacity-0'
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
                    <span className="block truncate overflow-hidden whitespace-nowrap" title={department.name}>
                      {department.name}
                    </span>
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
                  <span className="block truncate overflow-hidden whitespace-nowrap" title="Samlet">
                    Samlet
                  </span>
                </Link>
              </div>
            </button>
          </li>

          {/* Attendance menu */}
          <li>
            <button
              className="hover:bg-mustard flex w-full flex-col rounded-md p-2 transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation()
                setShowSubMenuAttendance((prev) => !prev)
              }}
              aria-expanded={showSubMenuAttendance}
            >
              <div className="flex w-full items-center gap-2">
                <CalendarClock className="text-cream" />
                <span className="truncate" title="Registrerede tider">
                  Registrerede tider
                </span>
                {showSubMenuAttendance ? <ChevronUp className="ml-auto" /> : <ChevronDown className="ml-auto" />}
              </div>

              <div
                className={`flex flex-col justify-items-start space-y-2 overflow-hidden pl-6 transition-all duration-300 ${
                  showSubMenuAttendance ? 'max-h-96 pt-2 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <Link
                  to={'/daily-overview'}
                  className="w-full rounded px-2 py-1 text-left text-sm transition duration-150"
                >
                  <span className="block truncate overflow-hidden whitespace-nowrap" title="Fravær">
                    Daglig oversigt
                  </span>
                </Link>
                <Link to={'/attendance'} className="w-full rounded px-2 py-1 text-left text-sm transition duration-150">
                  <span className="block truncate overflow-hidden whitespace-nowrap" title="Medarbejder tider">
                    Medarbejder tider
                  </span>
                </Link>
                <Link to={'/absence'} className="w-full rounded px-2 py-1 text-left text-sm transition duration-150">
                  <span className="block truncate overflow-hidden whitespace-nowrap" title="Fravær">
                    Fravær
                  </span>
                </Link>
                <Link
                  to={'/attendance-report'}
                  className="w-full rounded px-2 py-1 text-left text-sm transition duration-150"
                >
                  <span className="block truncate overflow-hidden whitespace-nowrap" title="Rapport">
                    Rapport
                  </span>
                </Link>
              </div>
            </button>
          </li>

          {/* Other main links */}
          {menuItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`hover:bg-mustard flex items-center gap-2 rounded-md p-2 transition-colors duration-200 ${
                    location.pathname === item.href ? 'bg-mustard/20' : ''
                  }`}
                  onClick={() => {
                    setShowSubMenuOverview(false)
                    setShowSubMenuAttendance(false)
                  }}
                >
                  <item.icon className="text-cream" />
                  <span className="block truncate overflow-hidden whitespace-nowrap" title={item.label}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
        </ul>

        {/* Sticky Logout */}
        <div className="border-mustard/30 border-t pt-4">
          <button onClick={logout} className="btn btn-rust w-full">
            <LogOut size={16} />
            Log ud
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
