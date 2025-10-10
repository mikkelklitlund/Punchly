import { useState } from 'react'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../common/Modal'
import { Role } from 'shared'
import { translateRole } from '../../utils/roleTranslation'

export type UserFormValues = {
  email: string
  username: string
  password?: string
  shouldChangePassword: boolean
  userRole: Role
}

interface Props {
  initialValues: UserFormValues
  onSubmit: (values: UserFormValues) => Promise<void>
  submitLabel?: string
  onCancel?: () => void
  onDelete?: () => Promise<void>
}

const UserForm = ({ initialValues, onSubmit, submitLabel = 'Gem', onCancel, onDelete }: Props) => {
  const [email, setEmail] = useState(initialValues.email)
  const [username, setUsername] = useState(initialValues.username ?? '')
  const [password, setPassword] = useState(initialValues.password ?? '')
  const [userRole, setUserRole] = useState<Role>(initialValues.userRole ?? Role.MANAGER)
  const [shouldChangePassword, setShouldChangePassword] = useState(initialValues.shouldChangePassword ?? false)

  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { [key: string]: string } = {}

    if (!username.trim()) newErrors.username = 'Brugernavn er påkrævet'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setIsSaving(true)
    try {
      await onSubmit({
        email,
        username,
        password: password || undefined,
        shouldChangePassword,
        userRole,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSaving}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((prev) => ({ ...prev, email: '' }))
              }}
              className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSaving}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Brugernavn</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setErrors((prev) => ({ ...prev, username: '' }))
              }}
              className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSaving}
            />
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Adgangskode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              disabled={isSaving}
            />
            {onDelete && (
              <p className="mt-1 text-xs text-gray-500 italic">
                Lad feltet være tomt for at beholde den nuværende adgangskode.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Brugerrolle</label>
            <select
              value={userRole}
              onChange={(e) => {
                setUserRole(e.target.value as Role)
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              disabled={isSaving}
            >
              <option value="" hidden>
                Vælg rolle...
              </option>
              {Object.values(Role).map((r) => (
                <option key={r} value={r}>
                  {translateRole(r)}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 sm:col-span-2">
            <div className="flex items-center">
              <input
                id="shouldChangePassword"
                type="checkbox"
                checked={shouldChangePassword}
                onChange={(e) => setShouldChangePassword(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                disabled={isSaving}
              />
              <label htmlFor="shouldChangePassword" className="ml-2 block text-sm text-gray-900">
                Kræv adgangskode nulstilling ved næste login
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          {onDelete ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-red"
              disabled={isSaving}
            >
              Slet
            </button>
          ) : onCancel ? (
            <button type="button" onClick={onCancel} className="btn btn-gray" disabled={isSaving}>
              Annuller
            </button>
          ) : (
            <span />
          )}

          <button type="submit" disabled={isSaving} className="btn btn-green">
            {isSaving && <LoadingSpinner size="small" />}
            {isSaving ? 'Gemmer...' : submitLabel}
          </button>
        </div>
      </form>

      {onDelete && showDeleteConfirm && (
        <Modal title="Bekræft sletning" closeModal={() => setShowDeleteConfirm(false)}>
          <p className="mb-4 text-sm text-gray-700">
            Er du sikker på, at du vil slette denne bruger? Denne handling kan ikke fortrydes.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Annuller
            </button>
            <button
              type="button"
              onClick={async () => {
                await onDelete()
                setShowDeleteConfirm(false)
              }}
              className="btn btn-red"
            >
              Slet
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default UserForm
