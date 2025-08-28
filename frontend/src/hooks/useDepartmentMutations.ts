import { useMutation, useQueryClient } from '@tanstack/react-query'
import { companyService } from '../services/companyService'
import { qk } from './queryKeys'
import { toast } from 'react-toastify'

export function useDepartmentMutations(companyId?: number) {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (name: string) => companyService.createDepartment(companyId!, name),
    onSuccess: () => {
      toast.success('Afdeling oprettet')
      qc.invalidateQueries({ queryKey: qk.departments(companyId) })
      qc.invalidateQueries({ queryKey: qk.employees(companyId) })
    },
    onError: () => toast.error('Kunne ikke oprette afdeling'),
  })

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => companyService.renameDepartment(companyId!, id, name),
    onSuccess: () => {
      toast.success('Afdeling opdateret')
      qc.invalidateQueries({ queryKey: qk.departments(companyId) })
    },
    onError: () => toast.error('Kunne ikke opdatere afdeling'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => companyService.deleteDepartment(companyId!, id),
    onSuccess: () => {
      toast.success('Afdeling slettet')
      qc.invalidateQueries({ queryKey: qk.departments(companyId) })
      qc.invalidateQueries({ queryKey: qk.employees(companyId) })
    },
    onError: () => toast.error('Kunne ikke slette afdeling'),
  })

  return { create, rename, remove }
}
