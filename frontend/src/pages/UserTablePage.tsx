import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DataTable, { Column } from '../components/common/DataTable'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { useAuth } from '../contexts/AuthContext'
import { companyService } from '../services/companyService'
import { ApiError } from '../utils/errorUtils'
import { UserDTO } from 'shared'
import CreateUserComponent from '../components/manager/CreateUserForm'

const UserTablePage = () => {
  const { companyId } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const {
    data: users = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<{ users: UserDTO[] }, ApiError, UserDTO[]>({
    queryKey: ['users', { companyId }],
    enabled: !!companyId,
    queryFn: () => companyService.getUsers(companyId!),
    select: (d) => d.users,
    staleTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: (n, err) => (err.status && err.status >= 500 ? n < 2 : false),
  })

  const numbered = useMemo(() => users.map((m, i) => ({ ...m, _row: i + 1 })), [users])

  const columns: Column<UserDTO & { _row?: number }>[] = [
    { header: '#', accessor: (row) => row._row ?? 0 },
    { header: 'Brugernavn', accessor: 'username' as const },
    { header: 'Email', accessor: 'email' as const },
    { header: 'Rolle', accessor: 'role' as const },
  ]

  const closeCreateModal = () => {
    setShowCreateModal(false)
  }

  return (
    <>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Konto oversigt</h2>
          <div className="flex items-center gap-3">
            {isFetching && <LoadingSpinner size="small" />}
            <button onClick={() => setShowCreateModal(true)} className="btn btn-rust">
              Ny Konto
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={numbered}
          rowKey={(u) => u.id}
          isLoading={isLoading && users.length === 0}
          error={error?.message || null}
          emptyMessage="Ingen managers fundet"
        />
      </div>

      {showCreateModal && (
        <Modal title="Opret ny Manager" closeModal={closeCreateModal}>
          <CreateUserComponent
            onSuccess={() => {
              closeCreateModal()
              refetch()
            }}
          />
        </Modal>
      )}
    </>
  )
}

export default UserTablePage
