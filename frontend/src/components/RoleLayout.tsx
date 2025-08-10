import { Navigate, Outlet } from 'react-router-dom'
import { Role } from 'shared'
import { useAuth } from '../contexts/AuthContext'

interface RoleLayoutProps {
  allowedRoles: Role[]
}

function RoleLayout({ allowedRoles }: RoleLayoutProps) {
  const { role } = useAuth()

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RoleLayout
