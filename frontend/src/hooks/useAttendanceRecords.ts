// hooks/useAttendanceRecords.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { employeeService } from '../services/employeeService'
import { AttendanceRecord } from 'shared'
import { qk } from './queryKeys'

type ApiError = { status?: number; message?: string }

export function useAttendanceRecords(employeeId: number | undefined) {
  return useQuery<AttendanceRecord[], ApiError>({
    queryKey: qk.attendanceRecords(employeeId),
    enabled: !!employeeId,
    queryFn: () => employeeService.getAttendanceRecords(employeeId!),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })
}
