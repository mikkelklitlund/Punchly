import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

function PasswordChangePage() {
  const { changePassword, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (newPassword !== confirmPassword) {
      setErrorMessage('Adgangskoderne stemmer ikke overens.')
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage('Adgangskoden skal være mindst 8 tegn.')
      return
    }

    await toast.promise(changePassword(newPassword), {
      success: 'Adgangskoden blev opdateret!',
      error: 'Kunne ikke opdatere adgangskode. Prøv igen.',
    })
    navigate('/')
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white px-6 py-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-zinc-700">Punchly</h1>
        <h2 className="mb-6 text-center text-xl font-medium text-zinc-600">Skift adgangskode</h2>

        {errorMessage && <p className="mb-4 text-center text-sm text-red-600">{errorMessage}</p>}

        <form onSubmit={handlePasswordChange} noValidate>
          <div className="mb-4">
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-zinc-700">
              Ny adgangskode
            </label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="focus:border-mustard focus:ring-mustard w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-xs focus:outline-hidden"
              placeholder="Indtast ny adgangskode"
              autoComplete="new-password"
              required
              disabled={authLoading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-zinc-700">
              Gentag adgangskode
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="focus:border-mustard focus:ring-mustard w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-xs focus:outline-hidden"
              placeholder="Gentag ny adgangskode"
              autoComplete="new-password"
              required
              disabled={authLoading}
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="bg-mustard hover:bg-burnt focus:ring-mustard inline-flex w-full items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-xs focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:opacity-50"
          >
            {authLoading && <LoadingSpinner size="small" />}
            {authLoading ? 'Opdaterer…' : 'Skift adgangskode'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default PasswordChangePage
