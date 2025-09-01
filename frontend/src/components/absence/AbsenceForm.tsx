import { useState } from 'react'
import Modal from '../common/Modal'

export type AbsenceFormValues = {
  employeeId?: number | ''
  absenceTypeId?: number | ''
  startDate: string // yyyy-mm-dd
  endDate: string // yyyy-mm-dd
}

type Option = { id: number; name: string }

interface Props {
  title: string
  employees: Option[]
  absenceTypes: Option[]
  initialValues: AbsenceFormValues
  submitLabel?: string
  onSubmit: (values: AbsenceFormValues) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}

const AbsenceForm = ({
  title,
  employees,
  absenceTypes,
  initialValues,
  submitLabel = 'Gem',
  onSubmit,
  onCancel,
  onDelete,
}: Props) => {
  const [employeeId, setEmployeeId] = useState<number | ''>(initialValues.employeeId ?? '')
  const [absenceTypeId, setAbsenceTypeId] = useState<number | ''>(initialValues.absenceTypeId ?? '')
  const [startDate, setStartDate] = useState(initialValues.startDate ?? '')
  const [endDate, setEndDate] = useState(initialValues.endDate ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !absenceTypeId || !startDate || !endDate) return
    setIsSaving(true)
    try {
      await onSubmit({ employeeId, absenceTypeId, startDate, endDate })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Medarbejder</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Vælg medarbejder...</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Fraværstype</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={absenceTypeId}
            onChange={(e) => setAbsenceTypeId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Vælg type...</option>
            {absenceTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Startdato</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slutdato</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          {onDelete ? (
            <button
              type="button"
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving}
            >
              Slet
            </button>
          ) : (
            <button type="button" className="rounded-md bg-gray-200 px-4 py-2" onClick={onCancel} disabled={isSaving}>
              Annuller
            </button>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </form>

      {/* Delete confirm inside the same modal context */}
      {onDelete && showDeleteConfirm && (
        <Modal title="Bekræft sletning" closeModal={() => setShowDeleteConfirm(false)}>
          <p className="mb-4 text-sm text-gray-700">Er du sikker på, at du vil slette dette fravær?</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Annuller
            </button>
            <button
              type="button"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              onClick={async () => {
                await onDelete()
                setShowDeleteConfirm(false)
              }}
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
