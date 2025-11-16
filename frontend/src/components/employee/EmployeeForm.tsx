import { useState } from 'react'
import { useCompany } from '../../contexts/CompanyContext'
import LoadingSpinner from '../common/LoadingSpinner'
import { getProfilePictureUrl } from '../../utils/imageUtils'
import Modal from '../common/Modal'
import { CalendarDate } from 'shared'

export type EmployeeFormValues = {
  name: string
  birthdate?: CalendarDate
  address: string
  city: string
  departmentId?: number | ''
  employeeTypeId?: number | ''
  monthlySalary?: number
  hourlySalary?: number
  monthlyHours?: number
  profilePicturePath?: string
}

interface Props {
  initialValues: EmployeeFormValues
  onSubmit: (values: EmployeeFormValues, imageFile: File | null) => Promise<void>
  submitLabel?: string
  onCancel?: () => void
  onDelete?: () => Promise<void>
}

const EmployeeForm = ({ initialValues, onSubmit, submitLabel = 'Gem', onCancel, onDelete }: Props) => {
  const { departments, employeeTypes } = useCompany()

  const [name, setName] = useState(initialValues.name ?? '')
  const [birthdate, setBirthdate] = useState(initialValues.birthdate ?? '')
  const [address, setAddress] = useState(initialValues.address ?? '')
  const [city, setCity] = useState(initialValues.city ?? '')
  const [departmentId, setDepartmentId] = useState<number | ''>(initialValues.departmentId ?? '')
  const [employeeTypeId, setEmployeeTypeId] = useState<number | ''>(initialValues.employeeTypeId ?? '')

  const [monthlySalary, setMonthlySalary] = useState<string>(initialValues.monthlySalary?.toString() ?? '')
  const [hourlySalary, setHourlySalary] = useState<string>(initialValues.hourlySalary?.toString() ?? '')
  const [monthlyHours, setMonthlyHours] = useState<number | undefined>(initialValues.monthlyHours ?? undefined)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>(initialValues.profilePicturePath ?? '')

  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result) setPreview(String(reader.result))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: string } = {}

    if (!name) newErrors.name = 'Navn er påkrævet'
    if (!departmentId) newErrors.departmentId = 'Vælg en afdeling'
    if (!employeeTypeId) newErrors.employeeTypeId = 'Vælg en medarbejdertype'

    const parsedMonthlySalary = monthlySalary ? Number(monthlySalary) : 0
    const parsedHourlySalary = hourlySalary ? Number(hourlySalary) : 0

    if ((parsedMonthlySalary ?? 0) > 0 && (parsedHourlySalary ?? 0) > 0) {
      newErrors.salary = 'Udfyld kun én af lønfelterne'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSaving(true)
    try {
      await onSubmit(
        {
          name,
          birthdate,
          address,
          city,
          departmentId,
          employeeTypeId,
          monthlySalary: parsedMonthlySalary > 0 ? parsedMonthlySalary : undefined,
          hourlySalary: parsedHourlySalary > 0 ? parsedHourlySalary : undefined,
          monthlyHours: monthlyHours,
          profilePicturePath: initialValues.profilePicturePath,
        },
        imageFile
      )
    } finally {
      setIsSaving(false)
    }
  }

  const renderPreviewSrc = preview.startsWith('data:') || preview === '' ? preview : getProfilePictureUrl(preview)

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSaving}>
        {/* Image + Upload */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="h-28 w-28 overflow-hidden rounded-md bg-gray-100 shadow-md">
            {renderPreviewSrc ? (
              <img src={renderPreviewSrc} alt="Profilbillede" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Intet billede</div>
            )}
          </div>

          <div className="flex h-28 flex-col items-center justify-end sm:items-start sm:justify-end">
            <label htmlFor="imageUpload" className={`btn btn-gray ${isSaving ? 'pointer-events-none opacity-50' : ''}`}>
              {imageFile ? 'Skift billede' : 'Vælg billede'}
            </label>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSaving}
            />
            <p className="mt-1 text-xs text-gray-500">{imageFile ? imageFile.name : 'Ingen fil valgt'}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Navn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors((prev) => ({ ...prev, name: '' }))
              }}
              className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSaving}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Birthdate */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Fødselsdato</label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              disabled={isSaving}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              disabled={isSaving}
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700">By</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              disabled={isSaving}
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Afdeling</label>
            <select
              value={departmentId ?? ''}
              onChange={(e) => {
                setDepartmentId(Number(e.target.value))
                setErrors((prev) => ({ ...prev, departmentId: '' }))
              }}
              className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm ${errors.departmentId ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSaving}
            >
              <option value="" hidden>
                Vælg afdeling...
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.departmentId && <p className="mt-1 text-sm text-red-600">{errors.departmentId}</p>}
          </div>

          {/* Employee type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Medarbejdertype</label>
            <select
              value={employeeTypeId ?? ''}
              onChange={(e) => {
                setEmployeeTypeId(Number(e.target.value))
                setErrors((prev) => ({ ...prev, employeeTypeId: '' }))
              }}
              className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm ${errors.employeeTypeId ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isSaving}
            >
              <option value="" hidden>
                Vælg type...
              </option>
              {employeeTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.employeeTypeId && <p className="mt-1 text-sm text-red-600">{errors.employeeTypeId}</p>}
          </div>

          {/* Monthly Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Månedsløn (DKK)</label>
            <input
              type="number"
              value={monthlySalary}
              onChange={(e) => {
                setMonthlySalary(e.target.value)
                setErrors((prev) => ({ ...prev, salary: '' }))
              }}
              disabled={Number(hourlySalary) > 0 || isSaving}
              className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm disabled:bg-gray-100 ${errors.salary ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          {/* Hourly Salary */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Timeløn (DKK)</label>
            <input
              type="number"
              value={hourlySalary}
              onChange={(e) => {
                setHourlySalary(e.target.value)
                setErrors((prev) => ({ ...prev, salary: '' }))
              }}
              disabled={Number(monthlySalary) > 0 || isSaving}
              className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm disabled:bg-gray-100 ${errors.salary ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>

          {/* Monthly Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Månedlige timer</label>
            <input
              type="number"
              value={monthlyHours ?? ''}
              onChange={(e) => setMonthlyHours(e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              min={0}
              disabled={isSaving}
            />
          </div>
        </div>

        {errors.salary && <p className="mt-2 text-sm text-red-600">{errors.salary}</p>}
        <p className="mt-2 text-xs text-gray-500 italic">Udfyld kun én af lønfelterne: månedsløn eller timeløn.</p>

        {/* Actions */}
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

      {/* Confirm delete modal */}
      {onDelete && showDeleteConfirm && (
        <Modal title="Bekræft sletning" closeModal={() => setShowDeleteConfirm(false)}>
          <p className="mb-4 text-sm text-gray-700">
            Er du sikker på, at du vil slette denne medarbejder? Denne handling kan ikke fortrydes.
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

export default EmployeeForm
