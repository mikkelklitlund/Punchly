import { useQuery } from '@tanstack/react-query'
import { companyService } from '../services/companyService'
import { EmployeeTypeDTO } from 'shared'
import { qk } from './queryKeys'
import { ApiError } from '../utils/errorUtils'

export function useEmployeeTypes(companyId: number | undefined) {
  return useQuery<{ employeeTypes: EmployeeTypeDTO[] }, ApiError, EmployeeTypeDTO[]>({
    queryKey: qk.employeeTypes(companyId),
    enabled: !!companyId,
    queryFn: () => companyService.getEmployeeTypes(companyId!),
    select: (d) => d.employeeTypes,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })
}
