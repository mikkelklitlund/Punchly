import { useQuery } from '@tanstack/react-query'
import { companyService } from '../services/companyService'
import { Department } from 'shared'
import { qk } from './queryKeys'

type ApiError = { status?: number; message?: string }

export function useDepartments(companyId: number | undefined) {
  return useQuery<{ departments: Department[] }, ApiError, Department[]>({
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
