import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import { AuthProvider } from './contexts/AuthContext'
import LoginForm from './components/Login'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
