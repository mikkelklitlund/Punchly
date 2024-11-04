import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import LoginForm from './components/Login'
import Home from './pages/Home'
import { AppContextProvider } from './contexts/AppContext'

function AppLayout() {
  const location = useLocation()

  const isLoginPage = location.pathname === '/login'

  return (
    <div className="flex flex-col min-h-screen">
      {!isLoginPage && <Header />}
      <div className={`flex-grow ${!isLoginPage ? 'pt-16' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContextProvider>
        <AppLayout />
      </AppContextProvider>
    </BrowserRouter>
  )
}

export default App
