import { useQuery } from '@tanstack/react-query'
import { employeeService } from '../services/employeeService'
import { AbsenceRecord } from 'shared'

export function useEmployeeAbsences(employeeId?: number, start?: Date, end?: Date) {
  return useQuery<AbsenceRecord[]>({
    queryKey: ['absences', employeeId, start?.toISOString(), end?.toISOString()],
    queryFn: () => employeeService.getAbsences(employeeId!, start, end),
    enabled: !!employeeId,
  })
}
