import { toast } from 'react-toastify'
import AbsenceForm, { AbsenceFormValues } from './AbsenceForm'
import { employeeService } from '../../services/employeeService'
import { CreateAbsenceRecordDTO } from 'shared'

const CreateAbsenceForm = ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => {
  const submit = async (v: AbsenceFormValues) => {
    if (!v.absenceTypeId || !v.startDate || !v.endDate || !v.employeeId) {
      return
    }

    const ab: CreateAbsenceRecordDTO = {
      employeeId: v.employeeId,
      startDate: v.startDate,
      endDate: v.endDate,
      absenceTypeId: v.absenceTypeId,
    }

    await toast.promise(employeeService.createAbsence(ab), {
      success: 'Fravær oprettet',
      error: 'Fejl under oprettelse af fravær',
    })

    onSuccess()
  }

  return <AbsenceForm onSubmit={submit} onCancel={onCancel} submitLabel="Opret" />
}

export default CreateAbsenceForm
