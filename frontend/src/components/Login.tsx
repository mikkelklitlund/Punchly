import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCompanies } from '../hooks/useCompanies'

function Login() {
  const { login, isLoading, user } = useAuth()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { companies, loading } = useCompanies()

  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    try {
      const parsedInt = parseInt(selectedCompanyId)
      if (isNaN(parsedInt)) {
        setErrorMessage('Please select a valid company.')
        return
      }
      await login(username, password, parsedInt)
      navigate('/')
    } catch (error) {
      setErrorMessage((error as Error).message)
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-lg bg-gray-300 px-4 py-6 shadow-md sm:px-8">
        <h1 className="mb-4 text-center text-2xl font-bold text-zinc-700">Punchly</h1>
        <form onSubmit={handleLogin}>
          {errorMessage && <div className="mb-4 text-center text-sm text-red-600">{errorMessage}</div>}
          <div className="mb-4">
            <label htmlFor="company" className="mb-2 block text-sm font-medium text-zinc-700">
              Vælg Virksomhed
            </label>
            <select
              id="company"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-xs"
              required
              disabled={loading}
            >
              {loading ? (
                <option>Loading companies...</option>
              ) : (
                <>
                  <option value="">Vælg virksomhed...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-700">
              Brugernavn
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="focus:border-mustard focus:ring-mustard w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-xs focus:outline-hidden"
              placeholder="d1abcde"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-700">
              Adgangskode
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus:border-mustard focus:ring-mustard w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-xs focus:outline-hidden"
              placeholder="Adgangskode..."
              required
            />
            <a
              href="#"
              className="focus:ring-mustard text-xs text-zinc-700 hover:text-black focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
            >
              Glemt adgangskode?
            </a>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-mustard hover:bg-burnt focus:ring-mustard flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-xs focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
          >
            {isLoading ? 'Verificerer...' : 'Log ind'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
