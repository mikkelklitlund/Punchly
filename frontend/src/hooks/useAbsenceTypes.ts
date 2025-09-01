import { useQuery } from '@tanstack/react-query'
import { AbsenceType } from 'shared'
import { companyService } from '../services/companyService'

export function useAbsenceTypes(companyId?: number | null) {
  return useQuery({
    queryKey: ['absenceTypes', companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<AbsenceType[]> => {
      const { absenceTypes } = await companyService.getAbsenceTypes(companyId as number)
      return absenceTypes
    },
  })
}
