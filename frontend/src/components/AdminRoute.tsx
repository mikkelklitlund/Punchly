import { Navigate, Outlet } from 'react-router-dom'
import { Role } from 'shared'
import { useAuth } from '../contexts/AuthContext'

function AdminLayout() {
  const { role } = useAuth()

  if (!role || role !== Role.ADMIN) return <Navigate to="/" replace />

  return <Outlet />
}

export default AdminLayout
