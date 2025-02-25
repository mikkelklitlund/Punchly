import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import LoginForm from './components/Login'
import Home from './pages/Home'
import { AppContextProvider } from './contexts/AppContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AppContextProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="flex-grow pt-16">
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
              </Route>
            </Routes>
          </div>
        </div>
      </AppContextProvider>
    </BrowserRouter>
  )
}

export default App
