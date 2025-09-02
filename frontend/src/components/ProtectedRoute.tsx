import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ToastContainer } from 'react-toastify'
import { CompanyProvider } from '../contexts/CompanyContext'
import Layout from './common/Layout'

function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!user) {
    const from = location.pathname + (location.search || '') + (location.hash || '')
    return <Navigate to="/login" replace state={{ from }} />
  }

  return (
    <CompanyProvider>
      <Layout>
        <Outlet />
      </Layout>
      <ToastContainer position="bottom-right" limit={4} />
    </CompanyProvider>
  )
}
export default ProtectedRoute
