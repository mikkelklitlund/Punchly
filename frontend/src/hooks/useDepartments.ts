import { useQuery } from '@tanstack/react-query'
import { companyService } from '../services/companyService'
import { DepartmentDTO } from 'shared'
import { qk } from './queryKeys'
import { ApiError } from '../utils/errorUtils'

export function useDepartments(companyId: number | undefined) {
  return useQuery<{ departments: DepartmentDTO[] }, ApiError, DepartmentDTO[]>({
    queryKey: qk.departments(companyId),
    enabled: !!companyId,
    queryFn: () => companyService.getDepartments(companyId!),
    select: (d) => d.departments,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })
}
