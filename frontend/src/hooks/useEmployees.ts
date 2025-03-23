import { useEffect, useState, useMemo } from 'react'
import { SimpleEmployee } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { employeeService } from '../services/employeeService'
import { useDepartments } from './useDepartments'

export function useEmployees() {
  const { companyId } = useAuth()
  const { currentDepartment } = useDepartments()
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

  const filteredEmployees = useMemo(() => {
    if (!currentDepartment) return employees
    return employees.filter((employee) => employee.departmentId === currentDepartment.id)
  }, [employees, currentDepartment])

  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => (a.checkedIn === b.checkedIn ? 0 : a.checkedIn ? -1 : 1))
  }, [filteredEmployees])

  useEffect(() => {
    fetchEmployees()
  }, [companyId])

  return {
    employees: sortedEmployees,
    isLoading,
    error,
    fetchEmployees,
    refresh: fetchEmployees,
  }
}
