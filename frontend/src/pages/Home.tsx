import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import { SimpleEmployee } from 'shared'

function Home() {
  const { user, isLoading, companyId } = useAuth()
  const [employees, setEmployees] = useState<SimpleEmployee[]>([])
  const [error, setError] = useState<string>()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!companyId) return

      try {
        const result = await axios.get(`/companies/${companyId}/simple-employees`)
        setEmployees(result.data.employees)
      } catch (err) {
        console.error('Failed to fetch employees:', err)
        setError('Could not fetch employees. Please try again later.')
      }
    }

    const fetchData = async () => {
      if (!isLoading && !user) {
        navigate('/login')
      } else if (companyId) {
        await fetchEmployees()
      }
    }

    fetchData()
  }, [companyId, isLoading, user, navigate])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div>
      {employees.length > 0 ? employees.map((em) => <h1 key={em.name}>{em.name}</h1>) : <p>No employees found.</p>}
      <h1>Velkommen {user}</h1>
    </div>
  )
}

export default Home
