import { useEffect, useState } from 'react'
import { Company } from 'shared'
import { companyService } from '../services/companyService'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await companyService.getAllCompanies()
        setCompanies(data['companies'])
      } catch (error) {
        console.error('Failed to fetch companies:', error)
        setError('Could not load companies.')
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  return { companies, loading, error }
}
