import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyService } from '../services/companyService'

export function useAbsenceTypeMutations(companyId: number | undefined) {
  const qc = useQueryClient()
  const key = ['absenceTypes', companyId]

  const create = useMutation({
    mutationFn: async (name: string) => {
      if (!companyId) throw new Error('Missing companyId')
      return companyService.createAbsenceType(companyId, name)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      if (!companyId) throw new Error('Missing companyId')
      return companyService.renameAbsenceType(companyId, id, name)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      if (!companyId) throw new Error('Missing companyId')
      return companyService.deleteAbsenceType(companyId, id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { create, rename, remove }
}
