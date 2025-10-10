import { useState } from 'react'
import DataTable, { Column } from '../components/common/DataTable'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { useAuth } from '../contexts/AuthContext'
import { UserDTO } from 'shared'
import CreateUserComponent from '../components/manager/CreateUserForm'
import { translateRole } from '../utils/roleTranslation'
import { useUsers } from '../hooks/useUsers'

const UserTablePage = () => {
  const { companyId } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: users = [], isLoading, isFetching, error, refetch } = useUsers(companyId)

  const columns: Column<UserDTO>[] = [
    { header: 'Brugernavn', accessor: 'username' as const },
    { header: 'Email', accessor: 'email' as const },
    { header: 'Rolle', accessor: (row) => translateRole(row.role) },
  ]

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
          data={users}
          rowKey={(u) => u.id}
          isLoading={isLoading && users.length === 0}
          error={error?.message || null}
          emptyMessage="Ingen managers fundet"
        />
      </div>

      {showCreateModal && (
        <Modal title="Opret ny Manager" closeModal={() => setShowCreateModal(false)}>
          <CreateUserComponent
            onSuccess={() => {
              refetch()
              setShowCreateModal(false)
            }}
          />
        </Modal>
      )}
    </>
  )
}

export default UserTablePage
