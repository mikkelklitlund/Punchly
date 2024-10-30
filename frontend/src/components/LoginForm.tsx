import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login: React.FC = () => {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/home')
      // Redirect or show success
    } catch (error) {
      console.error('Login error', error)
      // Handle error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center w-screen dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg px-8 py-6 max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4 dark:text-gray-200">KOGS</h1>
        <form action="#" onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brugernavn
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow-sm rounded-md w-full px-3 py-2 border 
              border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="d1abcde"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adgangskode
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow-sm rounded-md w-full px-3 py-2 border 
              border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Adgangskode..."
              required
            />
            <a
              href="#"
              className="text-xs text-gray-600 hover:text-indigo-500 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent 
            rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
