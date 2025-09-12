import { useEffect, useState } from 'react'
import { companyService } from '../../services/companyService'
import { useAuth } from '../../contexts/AuthContext'
import DataTable, { Column } from '../common/DataTable'
import { UserDTO } from 'shared'
import { toast } from 'react-toastify'

const ManagerTable = () => {
  const [managers, setManagers] = useState<UserDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { companyId } = useAuth()

  useEffect(() => {
    if (!companyId) return

    const fetchManagers = async () => {
      try {
        const res = await companyService.getManagers(companyId)
        setManagers(res.managers)
      } catch (error) {
        console.error('Error fetching managers:', error)
        toast.error('Der opstod en fejl ved hentning af managers')
      } finally {
        setIsLoading(false)
      }
    }

    fetchManagers()
  }, [companyId])

  const columns: Column<UserDTO>[] = [
    {
      header: '#',
      accessor: (row) => managers.findIndex((u) => u.id === row.id) + 1,
    },
    { header: 'Brugernavn', accessor: 'username' as keyof UserDTO },
    { header: 'Email', accessor: 'email' as keyof UserDTO },
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
