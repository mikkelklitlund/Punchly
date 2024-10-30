import { useAuth } from '../contexts/AuthContext'

function Home() {
  const { user } = useAuth()

  if (!user) {
    return <div>Please log in</div>
  }

  return (
    <div>
      <h1>Welcome {user}</h1>
    </div>
  )
}

export default Home
