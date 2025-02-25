import { useEffect, useState } from 'react'
import axios from '../api/axios'
import { SimpleEmployee } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { useAppContext } from '../contexts/AppContext'

export function useEmployees() {
  const { companyId } = useAuth()
  const { currentDepartment } = useAppContext()
  const [employees, setEmployees] = useState<SimpleEmployee[]>([])
  const [error, setError] = useState<string>()

  const fetchEmployees = async () => {
    if (!companyId) return

    try {
      let sortedEmployees = []
      const endpoint = currentDepartment
        ? `/companies/${companyId}/${currentDepartment.id}/simple-employees`
        : `/companies/${companyId}/simple-employees`

      const result = await axios.get(endpoint)
      sortedEmployees = result.data.employees.sort((a: SimpleEmployee, b: SimpleEmployee) =>
        a.checkedIn === b.checkedIn ? 0 : a.checkedIn ? -1 : 1
      )

      setEmployees(sortedEmployees)
    } catch (err) {
      console.error('Failed to fetch employees:', err)
      setError('Could not fetch employees. Please try again later.')
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [companyId, currentDepartment])

  return { employees, error, fetchEmployees }
}
