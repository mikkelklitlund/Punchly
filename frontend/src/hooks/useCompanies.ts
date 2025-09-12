import { useQuery } from '@tanstack/react-query'
import { companyService } from '../services/companyService'
import { CompanyDTO } from 'shared'
import { qk } from './queryKeys'
import { ApiError } from '../utils/errorUtils'

export function useCompanies() {
  return useQuery<{ companies: CompanyDTO[] }, ApiError, CompanyDTO[]>({
    queryKey: qk.companies,
    queryFn: () => companyService.getAllCompanies(),
    select: (d) => d.companies,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })
}
