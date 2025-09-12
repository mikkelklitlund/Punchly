import { useEffect, useState } from 'react'
import { companyService } from '../../services/companyService'
import { User } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import DataTable, { Column } from '../common/DataTable'

const ManagerTable = () => {
  const [managers, setManagers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { companyId } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (!companyId) return

    const fetchManagers = async () => {
      try {
        const res = await companyService.getManagers(companyId)
        setManagers(res.managers)
      } catch (error) {
        console.error('Error fetching managers:', error)
        showToast('Der opstod en fejl ved hentning af managers', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchManagers()
  }, [companyId, showToast])

  const columns: Column<User>[] = [
    {
      header: '#',
      accessor: (row) => managers.findIndex((u) => u.id === row.id) + 1,
    },
    { header: 'Brugernavn', accessor: 'username' as keyof User },
    { header: 'Email', accessor: 'email' as keyof User },
  ]

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-semibold">Managerliste</h2>
      <DataTable
        columns={columns}
        data={managers}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        error={null}
        emptyMessage="Ingen managers fundet"
      />
    </div>
  )
}

export default ManagerTable
