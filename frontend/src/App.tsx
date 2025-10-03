import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { QueryClientProvider } from '@tanstack/react-query'
import { Role } from 'shared'
import RoleLayout from './components/RoleLayout'
import AttendanceOverviewPage from './pages/AttendanceOverviewPage'
import AttendanceReportPage from './pages/AttendanceReportPage'
import SettingsPage from './pages/SettingsPage'
import ManagerTablePage from './pages/ManagerTablePage'
import EmployeeTablePage from './pages/EmployeeTablePage'
import Home from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AbsenceOverviewPage from './pages/AbsenceOverviewPage'
import queryClient from './utils/queryClient'
import PasswordChangePage from './pages/PasswordChangePage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/change-password" element={<PasswordChangePage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route element={<RoleLayout allowedRoles={[Role.ADMIN, Role.MANAGER]} />}>
                <Route path="/employees" element={<EmployeeTablePage />} />
                <Route path="/attendance" element={<AttendanceOverviewPage />} />
                <Route path="/attendance-report" element={<AttendanceReportPage />} />
                <Route path="/absence" element={<AbsenceOverviewPage />} />
              </Route>
              <Route element={<RoleLayout allowedRoles={[Role.ADMIN]} />}>
                <Route path="/managers" element={<ManagerTablePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
