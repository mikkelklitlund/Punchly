import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/common/Layout'
import { CompanyProvider } from './contexts/CompanyContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Role } from 'shared'
import RoleLayout from './components/RoleLayout'
import { ToastContainer } from 'react-toastify'
import AttendanceOverviewPage from './pages/AttendanceOverviewPage'
import AttendanceReportPage from './pages/AttendanceReportPage'
import SettingsPage from './pages/SettingsPage'
import ManagerTablePage from './pages/ManagerTablePage'
import EmployeeTablePage from './pages/EmployeeTablePage'
import Home from './pages/HomePage'
import LoginPage from './pages/LoginPage'

function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <Layout>
              <Routes>
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Home />} />
                  <Route element={<RoleLayout allowedRoles={[Role.ADMIN, Role.MANAGER]} />}>
                    <Route path="/employees" element={<EmployeeTablePage />} />
                    <Route path="/attendance" element={<AttendanceOverviewPage />} />
                    <Route path="/attendance-report" element={<AttendanceReportPage />} />
                  </Route>
                  <Route element={<RoleLayout allowedRoles={[Role.ADMIN]} />}>
                    <Route path="/managers" element={<ManagerTablePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
              </Routes>
            </Layout>
            <ToastContainer position="bottom-right" limit={4} />
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
