import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function Home() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login')
    }
  }, [isLoading, user, navigate])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Welcome {user}</h1>
    </div>
  )
}

export default Home
