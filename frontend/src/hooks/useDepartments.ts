import { useState, useEffect } from 'react'
import { Department } from 'shared'
import { useAuth } from '../contexts/AuthContext'
import { companyService } from '../services/companyService'

export const useDepartments = () => {
  const { companyId, user, isLoading } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [currentDepartment, setCurrentDepartment] = useState<Department | undefined>(undefined)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && user && companyId) {
      fetchDepartments(companyId)
    } else {
      setDepartments([])
      setCurrentDepartment(undefined)
    }
  }, [companyId, user, isLoading])

  const fetchDepartments = async (companyId: number) => {
    setIsFetching(true)
    setError(null)
    try {
      const { departments } = await companyService.getDepartments(companyId)
      setDepartments(departments)
    } catch {
      setError('Failed to fetch departments')
    } finally {
      setIsFetching(false)
    }
  }

  return { departments, fetchDepartments, isFetching, currentDepartment, setCurrentDepartment, error }
}
