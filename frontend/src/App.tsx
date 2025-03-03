import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginForm from './components/Login'
import Home from './pages/Home'
import { AppContextProvider } from './contexts/AppContext'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/common/Layout'
import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContextProvider>
          <AuthProvider>
            <Layout>
              <Routes>
                <Route path="/login" element={<LoginForm />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Home />} />
                </Route>
              </Routes>
            </Layout>
          </AuthProvider>
        </AppContextProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
