import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { Company } from 'shared'
import { authService } from '../services/authService'

function LoginPage() {
  const { login, isLoading: authLoading, user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2>(1)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')

  const [discovering, setDiscovering] = useState(false)
  const [companiesForUser, setCompaniesForUser] = useState<Company[] | null>(null)

  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

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
      navigate('/', { replace: true })
    } catch {
      setErrorMessage('Login mislykkedes. Tjek brugernavn/adgangskode.')
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

  if (step === 1) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100">
        <div className="w-full max-w-md rounded-lg bg-gray-300 px-4 py-6 shadow-md sm:px-8">
          <h1 className="mb-4 text-center text-2xl font-bold text-zinc-700">Punchly</h1>
          <form onSubmit={handleUsernameSubmit} noValidate>
            {errorMessage && <div className="mb-4 text-center text-sm text-red-600">{errorMessage}</div>}

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
        </div>
      </div>
    )
  }

  // Step 2: choose company + password
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-lg bg-gray-300 px-4 py-6 shadow-md sm:px-8">
        <h1 className="mb-4 text-center text-2xl font-bold text-zinc-700">Punchly</h1>
        <form onSubmit={handleLoginSubmit} noValidate>
          {errorMessage && <div className="mb-4 text-center text-sm text-red-600">{errorMessage}</div>}

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
              // onClick={() => openResetModal()}
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
      </div>
    </div>
  )
}

export default LoginPage
