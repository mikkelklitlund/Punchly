import dayjs from 'dayjs'
import EmployeeForm, { EmployeeFormValues } from './EmployeeForm'
import { EmployeeDTO } from 'shared'
import { employeeService } from '../../services/employeeService'
import { toast } from 'react-toastify'

const EditEmployeeForm = ({ employee, onSuccess }: { employee: EmployeeDTO; onSuccess: () => void }) => {
  const initial: EmployeeFormValues = {
    name: employee.name,
    birthdate: employee.birthdate ? dayjs(employee.birthdate).format('YYYY-MM-DD') : '',
    address: employee.address,
    city: employee.city,
    departmentId: employee.departmentId,
    employeeTypeId: employee.employeeTypeId,
    monthlySalary: employee.monthlySalary || 0,
    hourlySalary: employee.hourlySalary || 0,
    profilePicturePath: employee.profilePicturePath || '',
  }

  const submit = async (v: EmployeeFormValues, imageFile: File | null) => {
    if ((v.monthlySalary ?? 0) > 0 && (v.hourlySalary ?? 0) > 0) {
      toast.error('Vælg enten månedsløn eller timeløn (ikke begge).')
      return
    }

    if (imageFile) {
      await toast.promise(employeeService.uploadProfilePicture(employee.id, imageFile), {
        success: 'Profilbillede opdateret',
        error: 'Fejl under billedupload',
      })
    }

    await toast.promise(
      employeeService.updateEmployee(employee.id, {
        name: v.name,
        address: v.address,
        city: v.city,
        departmentId: Number(v.departmentId),
        employeeTypeId: Number(v.employeeTypeId),
        monthlySalary: (v.monthlySalary ?? 0) > 0 ? v.monthlySalary : undefined,
        hourlySalary: (v.hourlySalary ?? 0) > 0 ? v.hourlySalary : undefined,
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
