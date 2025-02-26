import { useEffect, useState, useMemo } from 'react'
import axios from '../api/axios'
import { SimpleEmployee } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { useAppContext } from '../contexts/AppContext'

export function useEmployees() {
  const { companyId } = useAuth()
  const { currentDepartment } = useAppContext()
  const [employees, setEmployees] = useState<SimpleEmployee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = async () => {
    if (!companyId) return

    setIsLoading(true)
    setError(null)

    try {
      const endpoint = currentDepartment
        ? `/companies/${companyId}/${currentDepartment.id}/simple-employees`
        : `/companies/${companyId}/simple-employees`

      const result = await axios.get(endpoint)

      setEmployees(result.data.employees)
    } catch (err) {
      console.error('Failed to fetch employees:', err)
      setError('Could not fetch employees. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  // Sort employees with useMemo to avoid unnecessary re-sorts
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => (a.checkedIn === b.checkedIn ? 0 : a.checkedIn ? -1 : 1))
  }, [employees])

  useEffect(() => {
    fetchEmployees()
  }, [companyId, currentDepartment])

  return {
    employees: sortedEmployees,
    isLoading,
    error,
    fetchEmployees,
    refresh: fetchEmployees,
  }
}
