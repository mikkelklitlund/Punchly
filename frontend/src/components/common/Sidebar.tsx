import { Role } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { House, Users, Settings } from 'lucide-react'

function Sidebar() {
  const { role } = useAuth()

  if (!role || role === Role.COMPANY) return null

  const menuItems = [
    { label: 'Oversigt', href: '/', icon: House, roles: [Role.ADMIN, Role.MANAGER] },
    { label: 'Medarbejdere', href: '/employees', icon: Users, roles: [Role.ADMIN, Role.MANAGER] },
    { label: 'Managere', href: '/manage-managers', icon: Users, roles: [Role.ADMIN] },
    { label: 'Indstillinger', href: '/settings', icon: Settings, roles: [Role.ADMIN, Role.MANAGER] },
  ]

  return (
    <aside className="min-h-screen w-[12rem] max-w-56 bg-burnt p-4 text-white">
      <nav>
        <ul className="space-y-4">
          <li className="border-b-2 border-mustard">
            <p className="text-3xl font-bold">Punchly</p>
          </li>
          {menuItems
            .filter((item) => item.roles.includes(role))
            .map((item) => (
              <li key={item.href}>
                <a href={item.href} className="flex gap-2 rounded-md p-2 hover:bg-mustard">
                  <item.icon />
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
