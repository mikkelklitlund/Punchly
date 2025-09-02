import { useState } from 'react'
import { useAbsenceTypes } from '../../hooks/useAbsenceTypes'
import dayjs from 'dayjs'
import { useEmployees } from '../../hooks/useEmployees'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../common/Modal'
import { useAuth } from '../../contexts/AuthContext'

export type AbsenceFormValues = {
  employeeId: number | null
  startDate: string
  endDate: string
  absenceTypeId: number
}

interface Props {
  initialValues: AbsenceFormValues
  onSubmit: (values: AbsenceFormValues) => Promise<void>
  submitLabel?: string
  onCancel?: () => void
  onDelete?: () => Promise<void>
}

const AbsenceForm = ({ initialValues, onSubmit, submitLabel = 'Gem', onCancel, onDelete }: Props) => {
  const { companyId } = useAuth()
  const { data: absenceTypes = [] } = useAbsenceTypes(companyId)
  const { data: employees = [], isLoading: empLoading } = useEmployees(companyId)

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(initialValues.employeeId ?? null)
  const [startDate, setStartDate] = useState(initialValues.startDate)
  const [endDate, setEndDate] = useState(initialValues.endDate)
  const [absenceTypeId, setAbsenceTypeId] = useState<number>(initialValues.absenceTypeId)

  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployeeId) return
    if (!startDate || !endDate) return
    if (dayjs(endDate).isBefore(dayjs(startDate))) return

    setIsSaving(true)

    try {
      await onSubmit({
        employeeId: selectedEmployeeId,
        absenceTypeId,
        startDate,
        endDate,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
          Vælg medarbejder
        </label>
        <select
          id="employee"
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
          value={selectedEmployeeId || ''}
          disabled={empLoading || (initialValues.employeeId ? true : false)}
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

        <div>
          <label className="block text-sm font-medium text-gray-700">Første fraværs dag</label>
          <input
            type="date"
            value={dayjs(startDate).format('YYYY-MM-DD')}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Sidste fraværs dag</label>
          <input
            type="date"
            value={dayjs(endDate).format('YYYY-MM-DD')}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500"
            disabled={isSaving}
          />
        </div>

        <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
          Vælg fraværsårsag
        </label>
        <select
          id="absenceReason"
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          onChange={(e) => setAbsenceTypeId(parseInt(e.target.value))}
          value={absenceTypeId.toString() || ''}
        >
          <option value="" hidden>
            -- Vælg en fraværsårsag --
          </option>
          {absenceTypes.map((ab) => (
            <option key={ab.id} value={ab.id}>
              {ab.name}
            </option>
          ))}
        </select>

        {onDelete ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            disabled={isSaving}
          >
            Slet
          </button>
        ) : onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 hover:text-white"
            disabled={isSaving}
          >
            Annuller
          </button>
        ) : (
          <span />
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving && <LoadingSpinner size="small" />}
          {isSaving ? 'Gemmer...' : submitLabel}
        </button>
      </form>

      {onDelete && showDeleteConfirm && (
        <Modal title="Bekræft sletning" closeModal={() => setShowDeleteConfirm(false)}>
          <p className="mb-4 text-sm text-gray-700">
            Er du sikker på, at du vil slette dette fravær? Denne handling kan ikke fortrydes.
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
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Slet
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default AbsenceForm
