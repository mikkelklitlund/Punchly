import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/Login'
import Home from './pages/Home'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/common/Layout'
import { ToastProvider } from './contexts/ToastContext'
import ManagerTable from './components/manager/ManagerTable'
import { CompanyProvider } from './contexts/CompanyContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EmployeeTable from './pages/EmployeeTable'
import { Role } from 'shared'
import RoleLayout from './components/RoleLayout'
import AttendanceOverviewPage from './pages/AttendanceOverviewPage'
import AttendanceReportPage from './pages/AttendanceReport'

function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <CompanyProvider>
              <Layout>
                <Routes>
                  <Route path="*" element={<Navigate to="/" replace />} />
                  <Route path="/login" element={<LoginForm />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Home />} />
                    <Route element={<RoleLayout allowedRoles={[Role.ADMIN, Role.MANAGER]} />}>
                      <Route path="/employees" element={<EmployeeTable />} />
                      <Route path="/attendance" element={<AttendanceOverviewPage />} />
                      <Route path="/attendance-report" element={<AttendanceReportPage />} />
                    </Route>
                    <Route element={<RoleLayout allowedRoles={[Role.ADMIN]} />}>
                      <Route path="/managers" element={<ManagerTable />} />
                    </Route>
                  </Route>
                </Routes>
              </Layout>
            </CompanyProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
