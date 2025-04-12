import { useEffect, useState } from 'react'
import { companyService } from '../../services/companyService'
import { User } from 'shared'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const ManagerList = () => {
  const [managers, setManagers] = useState<User[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedData, setEditedData] = useState<Partial<User>>({})
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
      }
    }

    fetchManagers()
  }, [companyId])

  const handleEditClick = (manager: User) => {
    setEditingId(manager.id)
    setEditedData({ username: manager.username, email: manager.email })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditedData({})
  }

  const handleSave = async (id: number) => {
    try {
      // await companyService.updateManager(id, editedData)
      setManagers((prev) =>
        prev.map((manager) => (manager.id === id ? ({ ...manager, ...editedData } as User) : manager))
      )
      setEditingId(null)
      setEditedData({})
      showToast('Manager er opdateret', 'success')
    } catch {
      showToast('Manager blev ikke opdateret', 'error')
    }
  }

  const handleChange = (field: keyof User, value: string) => {
    setEditedData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-4 font-sans">
      <h2 className="mb-4 text-xl font-semibold">Managers</h2>
      <div className="overflow-x-auto">
        <table className="text-md min-w-full divide-y divide-gray-200 border border-gray-300 bg-gray-50">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">ID</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Brugernavn</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {managers.map((manager) => (
              <tr key={manager.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-800">{manager.id}</td>
                <td className="px-4 py-2">
                  {editingId === manager.id ? (
                    <input
                      className="w-full rounded border border-gray-300 px-2 py-1 text-gray-800"
                      value={editedData.username || ''}
                      onChange={(e) => handleChange('username', e.target.value)}
                    />
                  ) : (
                    manager.username
                  )}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {editingId === manager.id ? (
                    <input
                      className="w-full rounded border border-gray-300 px-2 py-1 text-gray-800"
                      value={editedData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  ) : (
                    manager.email
                  )}
                </td>
                <td className="flex justify-center space-x-2 px-4 py-2">
                  {editingId === manager.id ? (
                    <div className="flex w-full justify-around">
                      <button
                        className="rounded-md bg-green-600/80 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-green-600"
                        onClick={() => handleSave(manager.id)}
                      >
                        Gem
                      </button>
                      <button
                        className="rounded-md bg-red-600/80 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-red-600"
                        onClick={handleCancel}
                      >
                        Annuller
                      </button>
                    </div>
                  ) : (
                    <button
                      className="bg-rust hover:bg-rust/80 rounded-md px-4 py-2 font-medium text-white transition-colors duration-200"
                      onClick={() => handleEditClick(manager)}
                    >
                      Rediger
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {managers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                  Ingen managers blev fundet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ManagerList
