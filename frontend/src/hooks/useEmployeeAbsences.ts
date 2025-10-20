import { useQuery } from '@tanstack/react-query'
import { employeeService } from '../services/employeeService'
import { AbsenceRecordDTO, CalendarDate } from 'shared'

export function useEmployeeAbsences(start: CalendarDate, end: CalendarDate, employeeId: number | undefined) {
  return useQuery<AbsenceRecordDTO[]>({
    queryKey: ['absences', employeeId],
    queryFn: () => employeeService.getAbsences(employeeId!, start, end),
    enabled: !!employeeId,
  })
}
