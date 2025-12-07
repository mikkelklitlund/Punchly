import EmployeeForm, { EmployeeFormValues } from './EmployeeForm'
import { employeeService } from '../../services/employeeService'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'

const CreateEmployeeForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const { companyId } = useAuth()

  const initial: EmployeeFormValues = {
    name: '',
    birthdate: '',
    departmentId: '',
    employeeTypeId: '',
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

    const created = await toast.promise(
      employeeService.createEmployee({
        checkedIn: false,
        name: v.name,
        departmentId: Number(v.departmentId),
        employeeTypeId: Number(v.employeeTypeId),
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
