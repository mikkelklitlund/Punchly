import dayjs from 'dayjs'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useEmployees } from '../../hooks/useEmployees'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../common/Modal'

export type AttendanceFormValues = {
  employeeId: number | null
  checkIn?: string
  checkOut?: string
}

interface Props {
  initialValues?: AttendanceFormValues
  onSubmit: (values: AttendanceFormValues) => Promise<void>
  submitLabel?: string
  onCancel?: () => void
  onDelete?: () => Promise<void>
}

const AttendanceForm = ({ initialValues, onSubmit, submitLabel = 'Gem', onCancel, onDelete }: Props) => {
  const { companyId } = useAuth()
  const { data: employees = [], isLoading: empLoading } = useEmployees(companyId)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(initialValues?.employeeId ?? null)
  const [checkIn, setCheckIn] = useState<string | undefined>(
    initialValues ? dayjs(initialValues.checkIn).format('YYYY-MM-DDTHH:mm') : ''
  )
  const [checkOut, setCheckOut] = useState<string | undefined>(
    initialValues ? dayjs(initialValues.checkOut).format('YYYY-MM-DDTHH:mm') : ''
  )

  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: string } = {}

    if (!selectedEmployeeId) newErrors.employeeId = 'Vælg en medarbejder'
    if (!checkIn) newErrors.checkIn = 'Vælg tjek ind tidspunkt'
    if (!checkOut) newErrors.checkOut = 'Vælg tjek ud tidspunkt'
    if (dayjs(checkOut).isBefore(dayjs(checkIn))) newErrors.timeError = 'Tjek ud kan ikke være før tjek ind'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSaving(true)
    try {
      await onSubmit({
        employeeId: selectedEmployeeId,
        checkIn,
        checkOut,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee */}
        <div>
          <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
            Vælg medarbejder
          </label>
          <select
            id="employee"
            className={`w-full max-w-sm rounded-md border px-3 py-2 shadow-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${errors.employeeId ? 'border-red-500' : 'border-gray-300'}`}
            onChange={(e) => {
              setSelectedEmployeeId(Number(e.target.value))
              setErrors((prev) => ({ ...prev, employeeId: '' }))
            }}
            value={selectedEmployeeId || ''}
            disabled={empLoading || (initialValues?.employeeId ? true : false)}
          >
            <option value="" hidden>
              -- Vælg en medarbejder --
            </option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          {errors.employeeId && <p className="text-sm text-red-600">{errors.employeeId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tjek ind</label>
          <input
            type="datetime-local"
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value)
              setErrors((prev) => ({ ...prev, checkIn: '', timeError: '' }))
            }}
            className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm focus:ring-green-500 ${errors.checkIn || errors.timeError ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isSaving}
          />
          {errors.checkIn && <p className="mt-1 text-sm text-red-600">{errors.checkIn}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tjek ud</label>
          <input
            type="datetime-local"
            value={checkOut}
            onChange={(e) => {
              setCheckOut(e.target.value)
              setErrors((prev) => ({ ...prev, checkOut: '', timeError: '' }))
            }}
            className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm focus:ring-green-500 ${errors.checkOut || errors.timeError ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isSaving}
          />
          {errors.checkOut && <p className="mt-1 text-sm text-red-600">{errors.checkOut}</p>}
          {errors.timeError && <p className="mt-1 text-sm text-red-600">{errors.timeError}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
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

      {/* Delete Confirm */}
      {onDelete && showDeleteConfirm && (
        <Modal title="Bekræft sletning" closeModal={() => setShowDeleteConfirm(false)}>
          <p className="mb-4 text-sm text-gray-700">
            Er du sikker på, at du vil slette denne registrering? Denne handling kan ikke fortrydes.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn btn-gray">
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

export default AttendanceForm
