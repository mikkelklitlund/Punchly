import { useEffect, useState, useMemo } from 'react'
import { SimpleEmployee } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { useAppContext } from '../contexts/AppContext'
import { employeeService } from '../services/employeeService'

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
      const data = await employeeService.getEmployees(companyId)

      setEmployees(data.employees)
    } catch (err) {
      console.error('Failed to fetch employees:', err)
      setError('Could not fetch employees. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

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
