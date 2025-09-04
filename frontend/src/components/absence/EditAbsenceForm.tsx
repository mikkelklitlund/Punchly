import { AbsenceRecordDTO } from 'shared'
import AbsenceForm, { AbsenceFormValues } from './AbsenceForm'
import { toast } from 'react-toastify'
import { employeeService } from '../../services/employeeService'

const EditAbsenceForm = ({ absenceRec, onSuccess }: { absenceRec: AbsenceRecordDTO; onSuccess: () => void }) => {
  const iniValues: AbsenceFormValues = {
    employeeId: absenceRec.employeeId,
    absenceTypeId: absenceRec.absenceTypeId,
    startDate: absenceRec.startDate,
    endDate: absenceRec.endDate,
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
