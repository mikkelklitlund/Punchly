import { useState } from 'react'
import { useAbsenceTypes } from '../../hooks/useAbsenceTypes'
import { useEmployees } from '../../hooks/useEmployees'
import LoadingSpinner from '../common/LoadingSpinner'
import Modal from '../common/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { CalendarDate } from 'shared'
import { format, isBefore } from 'date-fns'

export type AbsenceFormValues = {
  employeeId: number | null
  startDate?: CalendarDate
  endDate?: CalendarDate
  absenceTypeId?: number
}

interface Props {
  initialValues?: AbsenceFormValues
  onSubmit: (values: AbsenceFormValues) => Promise<void>
  submitLabel?: string
  onCancel?: () => void
  onDelete?: () => Promise<void>
}

const AbsenceForm = ({ initialValues, onSubmit, submitLabel = 'Gem', onCancel, onDelete }: Props) => {
  const { companyId } = useAuth()
  const { data: absenceTypes = [] } = useAbsenceTypes(companyId)
  const { data: employees = [], isLoading: empLoading } = useEmployees(companyId)

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(initialValues?.employeeId ?? null)
  const [startDate, setStartDate] = useState<CalendarDate>(initialValues?.startDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState<CalendarDate>(initialValues?.endDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [absenceTypeId, setAbsenceTypeId] = useState<number>(initialValues?.absenceTypeId ?? 0)

  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: string } = {}

    if (!selectedEmployeeId) newErrors.employeeId = 'Vælg en medarbejder'
    if (!absenceTypeId) newErrors.absenceTypeId = 'Vælg en fraværsårsag'
    if (!startDate) newErrors.startDate = 'Vælg startdato'
    if (!endDate) newErrors.endDate = 'Vælg slutdato'

    if (isBefore(new Date(endDate), new Date(startDate))) newErrors.dateError = 'Slutdato kan ikke være før startdato'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
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

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Første fraværs dag</label>
          <input
            type="date"
            value={format(new Date(startDate), 'yyyy-MM-dd')}
            onChange={(e) => {
              setStartDate(e.target.value)
              setErrors((prev) => ({ ...prev, startDate: '', dateError: '' }))
            }}
            className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm focus:ring-green-500 ${errors.startDate || errors.dateError ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isSaving}
          />
          {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Sidste fraværs dag</label>
          <input
            type="date"
            value={format(new Date(endDate), 'yyyy-MM-dd')}
            onChange={(e) => {
              setEndDate(e.target.value)
              setErrors((prev) => ({ ...prev, endDate: '', dateError: '' }))
            }}
            className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm focus:ring-green-500 ${errors.endDate || errors.dateError ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isSaving}
          />
          {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
          {errors.dateError && <p className="mt-1 text-sm text-red-600">{errors.dateError}</p>}
        </div>

        {/* Absence Type */}
        <div>
          <label htmlFor="absenceReason" className="block text-sm font-medium text-gray-700">
            Vælg fraværsårsag
          </label>
          <select
            id="absenceReason"
            className={`w-full max-w-sm rounded-md border px-3 py-2 shadow-sm ${errors.absenceTypeId ? 'border-red-500' : 'border-gray-300'}`}
            onChange={(e) => {
              setAbsenceTypeId(parseInt(e.target.value))
              setErrors((prev) => ({ ...prev, absenceTypeId: '' }))
            }}
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
          {errors.absenceTypeId && <p className="mt-1 text-sm text-red-600">{errors.absenceTypeId}</p>}
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
            Er du sikker på, at du vil slette dette fravær? Denne handling kan ikke fortrydes.
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

export default AbsenceForm
