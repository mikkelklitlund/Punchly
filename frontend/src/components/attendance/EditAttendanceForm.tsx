import { AttendanceRecordDTO } from 'shared'
import { toast } from 'react-toastify'
import { employeeService } from '../../services/employeeService'
import AttendanceForm, { AttendanceFormValues } from './AttendanceForm'

interface Props {
  record: AttendanceRecordDTO
  onSuccess: () => void
}

const EditAttendanceForm = ({ record, onSuccess }: Props) => {
  const iniValues: AttendanceFormValues = {
    employeeId: record.employeeId,
    checkIn: record.checkIn,
    checkOut: record.checkOut ?? undefined,
  }

  const isOpenRecord = !record.checkOut && !record.autoClosed

  const submit = async (e: AttendanceFormValues) => {
    await toast.promise(
      employeeService.updateAttendanceRecord(record.id, {
        checkIn: e.checkIn,
        checkOut: e.checkOut,
        autoClosed: false,
      }),
      {
        success: 'Tidsregistrering opdateret',
        error: 'Fejl ved opdatering af registrering',
      }
    )
    onSuccess()
  }

  const del = async () => {
    await toast.promise(employeeService.deleteAttendanceRecord(record.id), {
      success: 'Tidsregistering slettet',
      error: 'Fejl ved sletning af tidsregistrering',
    })
    onSuccess()
  }

  if (isOpenRecord) {
    return (
      <div className="rounded-md border border-yellow-300 bg-yellow-100 p-4 text-sm text-yellow-800 shadow-sm">
        Denne registrering er stadig åben og kan ikke redigeres, før medarbejderen er tjekket ud.
      </div>
    )
  }

  return <AttendanceForm initialValues={iniValues} onSubmit={submit} onDelete={del} />
}

export default EditAttendanceForm
