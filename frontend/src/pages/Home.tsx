import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    navigate('/login')
  }

  return (
    <div>
      <h1>Welcome {user}</h1>
    </div>
  )
}

export default Home
