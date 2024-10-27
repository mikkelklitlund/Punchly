import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

function LoginForm() {
  const { login, error, isLoading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(username, password)
      // Redirect or show success message
    } catch {
      // Error is already handled by the auth context
      // But you can add custom UI handling here
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error.message}</div>}
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

export default LoginForm
