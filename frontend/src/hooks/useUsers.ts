import { UserDTO } from 'shared'
import { ApiError } from '../utils/errorUtils'
import { useQuery } from '@tanstack/react-query'
import { companyService } from '../services/companyService'

export function useUsers(companyId: number | undefined) {
  return useQuery<{ users: UserDTO[] }, ApiError, UserDTO[]>({
    queryKey: ['users', { companyId }],
    enabled: !!companyId,
    queryFn: () => companyService.getUsers(companyId!),
    select: (d) => d.users,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })
}
