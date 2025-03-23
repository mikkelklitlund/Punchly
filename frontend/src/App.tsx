import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginForm from './components/Login'
import Home from './pages/Home'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/common/Layout'
import { ToastProvider } from './contexts/ToastContext'
import ManagerList from './components/manager/ManagerList'
import AdminRoute from './components/AdminRoute'
import { CompanyProvider } from './contexts/CompanyContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
                  <Route path="/login" element={<LoginForm />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Home />} />
                    <Route element={<AdminRoute />}>
                      <Route path="/managers" element={<ManagerList />} />
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
