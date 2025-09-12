import { CreateAttendanceRecordDTO } from 'shared'
import AttendanceForm, { AttendanceFormValues } from './AttendanceForm'
import { toast } from 'react-toastify'
import { employeeService } from '../../services/employeeService'

const CreateAttendanceForm = ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => {
  const submit = async (v: AttendanceFormValues) => {
    if (!v.employeeId || !v.checkIn || !v.checkOut) {
      return
    }

    const at: CreateAttendanceRecordDTO = {
      employeeId: v.employeeId,
      checkIn: v.checkIn,
      checkOut: v.checkOut,
    }

    await toast.promise(employeeService.createAttendance(at), {
      success: 'Registering oprettet',
      error: 'Fejl under oprettelse af registering',
    })

    onSuccess()
  }

  return <AttendanceForm onSubmit={submit} onCancel={onCancel} submitLabel="Opret" />
}

export default CreateAttendanceForm
