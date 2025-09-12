import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { employeeService } from '../services/employeeService'
import { AttendanceRecordDTO } from 'shared'
import { qk } from './queryKeys'
import { ApiError } from '../utils/errorUtils'

export function useAttendanceRecords(employeeId: number | undefined, startDate: string, endDate: string) {
  return useQuery<AttendanceRecordDTO[], ApiError>({
    queryKey: qk.attendanceRecords(employeeId),
    enabled: !!employeeId,
    queryFn: () => employeeService.getAttendanceRecords(employeeId!, startDate, endDate),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })
}
