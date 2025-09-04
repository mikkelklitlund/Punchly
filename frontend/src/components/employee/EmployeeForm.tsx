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
  const [departmentId, setDepartmentId] = useState<number | ''>(initialValues.departmentId ?? departments[0]?.id ?? '')
  const [employeeTypeId, setEmployeeTypeId] = useState<number | ''>(
    initialValues.employeeTypeId ?? employeeTypes[0]?.id ?? ''
  )
  const [monthlySalary, setMonthlySalary] = useState<number>(initialValues.monthlySalary ?? 0)
  const [hourlySalary, setHourlySalary] = useState<number>(initialValues.hourlySalary ?? 0)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>(initialValues.profilePicturePath ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

    if (!departmentId || !employeeTypeId) return
    if ((monthlySalary ?? 0) > 0 && (hourlySalary ?? 0) > 0) return

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
          monthlySalary: monthlySalary || 0,
          hourlySalary: hourlySalary || 0,
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
          <div className="h-28 w-28 overflow-hidden rounded-full bg-gray-100 shadow-md">
            {renderPreviewSrc ? (
              <img src={renderPreviewSrc} alt="Profilbillede" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Intet billede</div>
            )}
          </div>

          <div className="flex h-28 flex-col items-center justify-end sm:items-start sm:justify-end">
            <label
              htmlFor="imageUpload"
              className={`cursor-pointer rounded bg-gray-100 px-4 py-2 text-sm text-gray-700 shadow hover:bg-gray-200 ${
                isSaving ? 'pointer-events-none opacity-50' : ''
              }`}
            >
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Navn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500"
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fødselsdato</label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500"
              disabled={isSaving}
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700">Afdeling</label>
            <select
              value={departmentId ?? ''}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              disabled={isSaving}
              required
            >
              <option value="" disabled>
                Vælg afdeling...
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Medarbejdertype</label>
            <select
              value={employeeTypeId ?? ''}
              onChange={(e) => setEmployeeTypeId(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              disabled={isSaving}
              required
            >
              <option value="" disabled>
                Vælg type...
              </option>
              {employeeTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Månedsløn (DKK)</label>
            <input
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(Number(e.target.value))}
              disabled={(hourlySalary ?? 0) > 0 || isSaving}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm disabled:bg-gray-100"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Timeløn (DKK)</label>
            <input
              type="number"
              value={hourlySalary}
              onChange={(e) => setHourlySalary(Number(e.target.value))}
              disabled={(monthlySalary ?? 0) > 0 || isSaving}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm disabled:bg-gray-100"
              min={0}
            />
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500 italic">Udfyld kun én af lønfelterne: månedsløn eller timeløn.</p>

        <div className="flex items-center justify-between pt-4">
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

export default EmployeeForm
