import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from '../api/axios'
import { Company } from 'shared'

const Login: React.FC = () => {
  const { login, user, isLoading } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get('/companies/all')
        setCompanies(response.data['companies'])
      } catch (error) {
        console.error('Failed to fetch companies:', error)
      }
    }
    fetchCompanies()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const parsedInt = parseInt(selectedCompanyId)
      if (isNaN(parsedInt)) {
        return
      }
      await login(username, password, parsedInt)
      navigate('/')
    } catch (error) {
      console.error('Login error', (error as Error).message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center w-screen bg-slate-100">
      <div className="bg-gray-300 shadow-md rounded-lg px-8 py-6 max-w-md">
        <h1 className="text-2xl text-zinc-700 font-bold text-center mb-4">KOGS</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="company" className="block text-sm font-medium text-zinc-700 mb-2">
              Vælg Virksomhed
            </label>
            <select
              id="company"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="shadow-sm rounded-md w-full px-3 py-2 border border-gray-300"
              required
            >
              <option value="">Vælg virksomhed...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-zinc-700 mb-2">
              Brugernavn
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow-sm rounded-md w-full px-3 py-2 border 
              border-gray-300 focus:outline-none focus:ring-mustard focus:border-mustard"
              placeholder="d1abcde"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-2">
              Adgangskode
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow-sm rounded-md w-full px-3 py-2 border 
              border-gray-300 focus:outline-none focus:ring-mustard focus:border-mustard"
              placeholder="Adgangskode..."
              required
            />
            <a
              href="#"
              className="text-xs text-zinc-700 hover:text-black 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard"
            >
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent 
            rounded-md shadow-sm text-sm font-medium text-white bg-mustard hover:bg-burnt 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard"
          >
            {isLoading ? 'Verificerer...' : 'Log ind'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
