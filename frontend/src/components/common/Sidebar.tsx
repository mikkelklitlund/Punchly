import { Role } from 'shared'
import { useAuth } from '../../contexts/AuthContext'

function Sidebar() {
  const { role } = useAuth()

  if (!role) return null

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', roles: [Role.ADMIN, Role.MANAGER] },
    { label: 'Employees', href: '/employees', roles: [Role.ADMIN, Role.MANAGER] },
    { label: 'Settings', href: '/settings', roles: [Role.ADMIN, Role.MANAGER] },
    { label: 'Manage Managers', href: '/manage-managers', roles: [Role.ADMIN] },
  ]

  return (
    <aside className="min-h-screen w-64 bg-gray-800 p-4 text-white">
      <nav>
        <ul className="space-y-4">
          {menuItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <li key={item.href}>
                <a href={item.href} className="block p-2 hover:bg-gray-700">
                  {item.label}
                </a>
              </li>
            ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
