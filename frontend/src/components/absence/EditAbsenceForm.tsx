import { AbsenceRecord } from 'shared'
import AbsenceForm, { AbsenceFormValues } from './AbsenceForm'
import { toast } from 'react-toastify'
import { employeeService } from '../../services/employeeService'
import dayjs from 'dayjs'

const EditAbsenceForm = ({ absenceRec, onSuccess }: { absenceRec: AbsenceRecord; onSuccess: () => void }) => {
  const iniValues: AbsenceFormValues = {
    employeeId: absenceRec.employeeId,
    absenceTypeId: absenceRec.absenceTypeId,
    startDate: dayjs(absenceRec.startDate).format('YYYY-MM-DD'),
    endDate: dayjs(absenceRec.endDate).format('YYYY-MM-DD'),
  }

  const submit = async (v: AbsenceFormValues) => {
    await toast.promise(
      employeeService.updateAbsence(absenceRec.id, {
        startDate: v.startDate,
        endDate: v.endDate,
        absenceTypeId: v.absenceTypeId,
      }),
      {
        success: 'Fravær opdateret',
        error: 'Fejl under opdatering af fravær',
      }
    )

    onSuccess()
  }

  const del = async () => {
    await toast.promise(employeeService.deleteAbsence(absenceRec.id), {
      success: 'Fravær slettet',
      error: 'Sletning mislykkedes',
    })
  }

  return <AbsenceForm initialValues={iniValues} onSubmit={submit} onDelete={del} />
}

export default EditAbsenceForm
