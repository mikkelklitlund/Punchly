import { useQuery } from '@tanstack/react-query'
import { AbsenceTypeDTO } from 'shared'
import { companyService } from '../services/companyService'

export function useAbsenceTypes(companyId: number | undefined) {
  return useQuery({
    queryKey: ['absenceTypes', companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<AbsenceTypeDTO[]> => {
      const { absenceTypes } = await companyService.getAbsenceTypes(companyId as number)
      return absenceTypes
    },
  })
}
