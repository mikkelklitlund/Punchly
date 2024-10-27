import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Header from './components/Header'
import LoginForm from './components/LoginForm'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
