import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { User } from 'shared'
import DataTable, { Column } from '../components/common/DataTable'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { companyService } from '../services/companyService'
import { ApiError } from '../utils/errorUtils'

const ManagerTablePage = () => {
  const { companyId } = useAuth()

  const {
    data: managers = [],
    isLoading,
    isFetching,
    error,
  } = useQuery<{ managers: User[] }, ApiError, User[]>({
    queryKey: ['managers', { companyId }],
    enabled: !!companyId,
    queryFn: () => companyService.getManagers(companyId!),
    select: (d) => d.managers,
    staleTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })

  const numbered = useMemo(() => managers.map((m, i) => ({ ...m, _row: i + 1 })), [managers])

  const columns: Column<User & { _row?: number }>[] = [
    { header: '#', accessor: (row) => row._row ?? 0 },
    { header: 'Brugernavn', accessor: 'username' as const },
    { header: 'Email', accessor: 'email' as const },
  ]

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-xl font-semibold">Managerliste</h2>
        {isFetching && <LoadingSpinner size="small" />}
      </div>

      <DataTable
        columns={columns}
        data={numbered}
        rowKey={(u) => u.id}
        isLoading={isLoading && managers.length === 0}
        error={error?.message || null}
        emptyMessage="Ingen managers fundet"
      />
    </div>
  )
}

export default ManagerTablePage
