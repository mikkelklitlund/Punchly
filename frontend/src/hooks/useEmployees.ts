import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { employeeService } from '../services/employeeService'
import { SimpleEmployee } from 'shared'
import { qk } from './queryKeys'
import { ApiError } from '../utils/errorUtils'

type UseEmployeesOpts = { live?: boolean; departmentId?: number }

const FIVE_MIN = 5 * 60 * 1000

export function useEmployees(companyId?: number, opts: UseEmployeesOpts = {}) {
  const { live = false, departmentId } = opts
  const interval = () => (document.visibilityState === 'visible' ? FIVE_MIN : false)

  return useQuery<{ employees: SimpleEmployee[]; total: number }, ApiError, SimpleEmployee[]>({
    queryKey: qk.employees(companyId, departmentId),
    enabled: !!companyId,
    queryFn: () => employeeService.getEmployees(companyId!, departmentId),
    select: (d) => d.employees,
    placeholderData: keepPreviousData,
    refetchInterval: live ? interval : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,

    notifyOnChangeProps: live ? 'all' : ['data', 'error'],

    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })
}
