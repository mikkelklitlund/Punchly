import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PasswordChangeRequiredError, useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { authService } from '../services/authService'
import { CompanyDTO } from 'shared'

function LoginPage() {
  const { login, isLoading: authLoading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState<1 | 2>(1)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')

  const [discovering, setDiscovering] = useState(false)
  const [companiesForUser, setCompaniesForUser] = useState<CompanyDTO[] | null>(null)

  const [errorMessage, setErrorMessage] = useState<string>('')

  const from = location?.state?.from || '/'

  useEffect(() => {
    if (user) {
      navigate(from === '/login' ? '/' : from, { replace: true })
    }
  }, [user, from, navigate])

  useEffect(() => {
    if (step === 2 && companiesForUser && companiesForUser.length === 1) {
      setSelectedCompanyId(String(companiesForUser[0].id))
    }
  }, [step, companiesForUser])

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const u = username.trim()
    if (!u) {
      setErrorMessage('Der skal udfyldes et brugernavn')
      return
    }

    try {
      setDiscovering(true)
      const list = await authService.getUserCompanies(u)
      setCompaniesForUser(list)
      setStep(2)
    } catch {
      setErrorMessage('Kunne ikke slå virksomhedsadgang op')
    } finally {
      setDiscovering(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const id = parseInt(selectedCompanyId, 10)
    if (Number.isNaN(id)) {
      setErrorMessage('Vælg venligst en gyldig virksomhed.')
      return
    }

    try {
      await login(username, password, id)
    } catch (error: unknown) {
      if (error instanceof PasswordChangeRequiredError) {
        navigate('/change-password')
      } else {
        console.error('An unknown error occurred.')
      }
    }
  }

  const companiesOptions = useMemo(
    () =>
      (companiesForUser ?? []).map((c) => (
        <option key={c.id} value={String(c.id)}>
          {c.name}
        </option>
      )),
    [companiesForUser]
  )
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white px-6 py-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-zinc-700">Punchly</h1>

        {step === 1 ? (
          <form onSubmit={handleUsernameSubmit} noValidate>
            {errorMessage && <p className="mb-4 text-center text-sm text-red-600">{errorMessage}</p>}

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
                disabled={discovering || authLoading}
              />
            </div>

            <button
              type="submit"
              disabled={discovering || authLoading}
              className="bg-mustard hover:bg-burnt focus:ring-mustard inline-flex w-full items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-xs focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:opacity-50"
            >
              {(discovering || authLoading) && <LoadingSpinner size="small" />}
              {discovering ? 'Finder virksomheder…' : 'Fortsæt'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} noValidate>
            {errorMessage && <p className="mb-4 text-center text-sm text-red-600">{errorMessage}</p>}

            <div className="mb-4">
              <label htmlFor="company" className="mb-2 block text-sm font-medium text-zinc-700">
                Vælg virksomhed
              </label>
              <select
                id="company"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-xs"
                required
                disabled={authLoading}
              >
                <option value="" disabled>
                  {companiesForUser ? 'Vælg virksomhed…' : 'Indlæser…'}
                </option>
                {companiesOptions}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-700">Brugernavn</label>
              <input
                type="text"
                value={username}
                disabled
                className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 shadow-xs"
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
                className="focus:ring-mustard mt-1 text-xs text-zinc-700 hover:text-black focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
              >
                Glemt adgangskode?
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md bg-gray-200 px-4 py-2 text-sm"
                onClick={() => {
                  setStep(1)
                  setPassword('')
                  setSelectedCompanyId('')
                  setCompaniesForUser(null)
                  setErrorMessage('')
                }}
                disabled={authLoading}
              >
                Tilbage
              </button>

              <button
                type="submit"
                disabled={authLoading || !selectedCompanyId}
                className="bg-mustard hover:bg-burnt focus:ring-mustard ml-auto inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-xs focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:opacity-50"
              >
                {authLoading && <LoadingSpinner size="small" />}
                {authLoading ? 'Verificerer…' : 'Log ind'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginPage
