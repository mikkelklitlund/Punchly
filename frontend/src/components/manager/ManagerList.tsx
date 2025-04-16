import { useEffect, useState } from 'react'
import { companyService } from '../../services/companyService'
import { User } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import LoadingSpinner from '../common/LoadingSpinner'

const ManagerList = () => {
  const [managers, setManagers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { companyId } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (!companyId) return

    const fetchManagers = async () => {
      setIsLoading(true)
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-semibold">Managerliste</h2>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full table-auto border border-gray-200">
          <thead className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
            <tr>
              <th className="border-b px-4 py-3">#</th>
              <th className="border-b px-4 py-3">Brugernavn</th>
              <th className="border-b px-4 py-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
            {managers.map((man, index) => (
              <tr key={index} className="transition-colors duration-200 even:bg-gray-50 hover:bg-gray-100">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{man.username}</td>
                <td className="px-4 py-3">{man.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ManagerList
