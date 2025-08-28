import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyService } from '../services/companyService'
import { qk } from './queryKeys'
import { toast } from 'react-toastify'

export function useEmployeeTypeMutations(companyId?: number) {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (name: string) => companyService.createEmployeeType(companyId!, name),
    onSuccess: () => {
      toast.success('Medarbejdertype oprettet')
      qc.invalidateQueries({ queryKey: qk.employeeTypes(companyId) })
    },
    onError: () => toast.error('Kunne ikke oprette medarbejdertype'),
  })

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => companyService.renameEmployeeType(companyId!, id, name),
    onSuccess: () => {
      toast.success('Medarbejdertype opdateret')
      qc.invalidateQueries({ queryKey: qk.employeeTypes(companyId) })
    },
    onError: () => toast.error('Kunne ikke opdatere medarbejdertype'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => companyService.deleteEmployeeType(companyId!, id),
    onSuccess: () => {
      toast.success('Medarbejdertype slettet')
      qc.invalidateQueries({ queryKey: qk.employeeTypes(companyId) })
    },
    onError: () => toast.error('Kunne ikke slette medarbejdertype'),
  })

  return { create, rename, remove }
}
