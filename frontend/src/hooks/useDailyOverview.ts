import { useQuery } from '@tanstack/react-query'
import { qk } from './queryKeys'
import { companyService } from '../services/companyService'

export function useDailyOverview(companyId: number | undefined, date: string) {
  return useQuery({
    queryKey: qk.dailyOverview(companyId, date),
    queryFn: async () => {
      if (!companyId) return []
      const res = await companyService.getDailyOverview(companyId, date)
      return res.records
    },
    enabled: !!companyId && !!date,
  })
}
