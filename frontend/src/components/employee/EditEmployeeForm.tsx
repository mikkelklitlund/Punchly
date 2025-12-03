import dayjs from 'dayjs'
import EmployeeForm, { EmployeeFormValues } from './EmployeeForm'
import { EmployeeDTO } from 'shared'
import { employeeService } from '../../services/employeeService'
import { toast } from 'react-toastify'

const EditEmployeeForm = ({ employee, onSuccess }: { employee: EmployeeDTO; onSuccess: () => void }) => {
  const initial: EmployeeFormValues = {
    name: employee.name,
    birthdate: employee.birthdate ? dayjs(employee.birthdate).format('YYYY-MM-DD') : '',
    departmentId: employee.departmentId,
    employeeTypeId: employee.employeeTypeId,
    profilePicturePath: employee.profilePicturePath || '',
  }

  const submit = async (v: EmployeeFormValues, imageFile: File | null) => {
    if (imageFile) {
      await toast.promise(employeeService.uploadProfilePicture(employee.id, imageFile), {
        success: 'Profilbillede opdateret',
        error: 'Fejl under billedupload',
      })
    }

    await toast.promise(
      employeeService.updateEmployee(employee.id, {
        name: v.name,
        departmentId: Number(v.departmentId),
        employeeTypeId: Number(v.employeeTypeId),
        birthdate: v.birthdate,
      }),
      { success: 'Medarbejder opdateret', error: 'Fejl under opdatering' }
    )

    onSuccess()
  }

  const del = async () => {
    if (employee.checkedIn) {
      toast.warn('Kan ikke slette en medarbejder der er tjekket ind.')
      return
    }

    await toast.promise(employeeService.deleteEmployee(employee.id), {
      success: 'Medarbejder slettet',
      error: 'Sletning mislykkedes',
    })
    onSuccess()
  }

  return <EmployeeForm initialValues={initial} onSubmit={submit} submitLabel="Gem" onDelete={del} />
}

export default EditEmployeeForm
