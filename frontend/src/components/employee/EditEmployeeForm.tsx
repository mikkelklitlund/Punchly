import { useState } from 'react'
import { Employee } from 'shared'
import { useCompany } from '../../contexts/CompanyContext'
import { employeeService } from '../../services/employeeService'
import { useToast } from '../../contexts/ToastContext'
import { getProfilePictureUrl } from '../../utils/imageUtils'

interface Props {
  employee: Employee
  onSuccess: () => void
}

const EditEmployeeForm = ({ employee, onSuccess }: Props) => {
  const { departments, employeeTypes, refreshEmployees } = useCompany()
  const { showToast } = useToast()

  const [name, setName] = useState(employee.name)
  const [birthdate, setBirthdate] = useState(employee.birthdate?.toString().slice(0, 10) || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [profilePicturePath, setProfilePicturePath] = useState(employee.profilePicturePath || '')
  const [address, setAddress] = useState(employee.address)
  const [city, setCity] = useState(employee.city)
  const [monthlySalary, setMonthlySalary] = useState(employee.monthlySalary || 0)
  const [hourlySalary, setHourlySalary] = useState(employee.hourlySalary || 0)
  const [departmentId, setDepartmentId] = useState(employee.departmentId)
  const [employeeTypeId, setEmployeeTypeId] = useState(employee.employeeTypeId)
  const [isSaving, setIsSaving] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)

      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result) {
          setProfilePicturePath(reader.result.toString())
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (imageFile) {
        await employeeService.uploadProfilePicture(employee.id, imageFile)
      }

      await employeeService.updateEmployee(employee.id, {
        name,
        birthdate: new Date(birthdate),
        address,
        city,
        departmentId,
        employeeTypeId,
        monthlySalary: monthlySalary > 0 ? monthlySalary : undefined,
        hourlySalary: hourlySalary > 0 ? hourlySalary : undefined,
      })

      showToast('Medarbejder opdateret!', 'success')
      refreshEmployees()
      onSuccess()
    } catch (error) {
      console.error(error)
      showToast('Kunne ikke opdatere medarbejderen', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image + Upload */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <img
          src={profilePicturePath.startsWith('data:') ? profilePicturePath : getProfilePictureUrl(profilePicturePath)}
          alt="Profilbillede"
          className="h-28 w-28 rounded-full object-cover shadow-md"
        />

        <div className="flex h-28 flex-col items-center justify-end sm:items-start sm:justify-end">
          <label
            htmlFor="imageUpload"
            className="cursor-pointer rounded bg-gray-100 px-4 py-2 text-sm text-gray-700 shadow hover:bg-gray-200"
          >
            Skift billede
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleImageChange}
            className="hidden"
          />
          <p className="mt-1 text-xs text-gray-500">{imageFile ? imageFile.name : 'Ingen fil valgt'}</p>
        </div>
      </div>

      {/* Fields Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Personal Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Navn</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fødselsdato</label>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Adresse</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">By</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        {/* Department and Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Afdeling</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Medarbejdertype</label>
          <select
            value={employeeTypeId}
            onChange={(e) => setEmployeeTypeId(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          >
            {employeeTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Salaries */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Månedsløn (DKK)</label>
          <input
            type="number"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(Number(e.target.value))}
            disabled={hourlySalary > 0}
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
            disabled={monthlySalary > 0}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm disabled:bg-gray-100"
            min={0}
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500 italic">Udfyld kun én af lønfelterne: månedsløn eller timeløn.</p>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? 'Gemmer...' : 'Gem ændringer'}
        </button>
      </div>
    </form>
  )
}

export default EditEmployeeForm
