import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCompanies } from '../hooks/useCompanies'
import LoadingSpinner from './common/LoadingSpinner'

function Login() {
  const { login, isLoading: authLoading, user } = useAuth()
  const { data: companies = [], isLoading: companiesLoading, error: companiesError } = useCompanies()

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const parsedInt = parseInt(selectedCompanyId, 10)
    if (Number.isNaN(parsedInt)) {
      setErrorMessage('Vælg venligst en gyldig virksomhed.')
      return
    }

    try {
      await login(username, password, parsedInt)
      navigate('/', { replace: true })
    } catch {
      setErrorMessage('Login mislykkedes. Tjek brugernavn/adgangskode.')
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-lg bg-gray-300 px-4 py-6 shadow-md sm:px-8">
        <h1 className="mb-4 text-center text-2xl font-bold text-zinc-700">Punchly</h1>
        <form onSubmit={handleLogin} noValidate>
          {(errorMessage || companiesError) && (
            <div className="mb-4 text-center text-sm text-red-600">
              {errorMessage || 'Kunne ikke hente virksomheder.'}
            </div>
          )}

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
              disabled={companiesLoading || authLoading}
              aria-invalid={!!errorMessage}
            >
              <option value="" disabled>
                {companiesLoading ? 'Indlæser virksomheder...' : 'Vælg virksomhed...'}
              </option>
              {!companiesLoading &&
                companies.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
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
              autoComplete="username"
              required
              disabled={authLoading}
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
              autoComplete="current-password"
              required
              disabled={authLoading}
            />
            <button
              type="button"
              className="focus:ring-mustard text-xs text-zinc-700 hover:text-black focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
            >
              Glemt adgangskode?
            </button>
          </div>

          <button
            type="submit"
            disabled={authLoading || companiesLoading || !selectedCompanyId}
            className="bg-mustard hover:bg-burnt focus:ring-mustard inline-flex w-full items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-xs focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:opacity-50"
          >
            {authLoading && <LoadingSpinner size="small" />}
            {authLoading ? 'Verificerer...' : 'Log ind'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
