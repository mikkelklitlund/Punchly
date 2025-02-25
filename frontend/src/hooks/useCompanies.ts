import { useEffect, useState } from 'react'
import axios from '../api/axios'
import { Company } from 'shared'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get('/companies/all')
        setCompanies(response.data['companies'])
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
