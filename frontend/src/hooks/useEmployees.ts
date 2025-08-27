import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { employeeService } from '../services/employeeService'
import { SimpleEmployee } from 'shared'
import { qk } from './queryKeys'

type ApiError = { status?: number; message?: string }

export function useEmployees(companyId: number | undefined, departmentId?: number) {
  const interval = () => (document.visibilityState === 'visible' ? 30_000 : false)

  return useQuery<{ employees: SimpleEmployee[]; total: number }, ApiError, SimpleEmployee[]>({
    queryKey: qk.employees(companyId, departmentId),
    enabled: !!companyId,
    queryFn: () => employeeService.getEmployees(companyId!, departmentId),
    select: (d) => d.employees,
    placeholderData: keepPreviousData,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })
}
