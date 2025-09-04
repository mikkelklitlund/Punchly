import EmployeeForm, { EmployeeFormValues } from './EmployeeForm'
import { useCompany } from '../../contexts/CompanyContext'
import { employeeService } from '../../services/employeeService'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

const CreateEmployeeForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { companyId } = useAuth()
  const { departments, employeeTypes } = useCompany()

  const initial: EmployeeFormValues = {
    name: '',
    birthdate: '',
    address: '',
    city: '',
    departmentId: departments[0]?.id ?? '',
    employeeTypeId: employeeTypes[0]?.id ?? '',
    monthlySalary: 0,
    hourlySalary: 0,
    profilePicturePath: '',
  }

  const handleSubmit = async (v: EmployeeFormValues, imageFile: File | null) => {
    if (!companyId) {
      toast.error('Der er ikke valgt virksomhed')
      return
    }
    if (!v.birthdate) {
      toast.error('Der skal vælges fødselsdato')
      return
    }
    if ((v.monthlySalary ?? 0) > 0 && (v.hourlySalary ?? 0) > 0) {
      toast.error('Vælg enten månedsløn eller timeløn (ikke begge).')
      return
    }

    const created = await toast.promise(
      employeeService.createEmployee({
        checkedIn: false,
        name: v.name,
        address: v.address,
        city: v.city,
        departmentId: Number(v.departmentId),
        employeeTypeId: Number(v.employeeTypeId),
        monthlySalary: (v.monthlySalary ?? 0) > 0 ? v.monthlySalary : undefined,
        hourlySalary: (v.hourlySalary ?? 0) > 0 ? v.hourlySalary : undefined,
        birthdate: v.birthdate,
        companyId,
      }),
      { pending: 'Opretter…', success: 'Medarbejder oprettet', error: 'Fejl ved oprettelse af medarbejder' }
    )

    if (imageFile) {
      await toast.promise(employeeService.uploadProfilePicture(created.id, imageFile), {
        pending: 'Uploader billede…',
        success: 'Profilbillede uploadet',
        error: 'Fejl under upload',
      })
    }

    onSuccess()
  }

  return <EmployeeForm initialValues={initial} onSubmit={handleSubmit} submitLabel="Opret" onCancel={onSuccess} />
}

export default CreateEmployeeForm
