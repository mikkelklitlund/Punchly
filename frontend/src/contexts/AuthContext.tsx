import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react'
import axios from '../api/axios'
import { jwtDecode, JwtPayload } from 'jwt-decode'

interface AuthResponse extends JwtPayload {
  username?: string
}

export interface AuthContextType {
  user: string | null
  accessToken: string | null
  login: (username: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { username, password }, { withCredentials: true })
      setAccessToken(response.data.accessToken)
      setUser(response.data.username)
    } catch (error) {
      throw new Error('Login failed')
    }
  }, [])

  const register = useCallback(async (email: string, password: string, username: string) => {
    try {
      await axios.post('/auth/register', { email, password, username })
    } catch (error) {
      throw new Error('Registration failed')
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const response = await axios.get('/auth/refresh', { withCredentials: true })
      setAccessToken(response.data.accessToken)
      const decoded = jwtDecode(response.data.accessToken) as AuthResponse
      if (decoded.username) {
        setUser(decoded.username)
      }
      return response.data.accessToken
    } catch (error) {
      console.error('Token refresh failed:', error)
      setUser(null)
      setAccessToken(null)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      setAccessToken(null)
    }
  }, [])

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          try {
            const newAccessToken = await refresh()
            setAccessToken(newAccessToken)
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
            return axios(originalRequest)
          } catch (refreshError) {
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )

    return () => axios.interceptors.response.eject(interceptor)
  }, [refresh])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refresh()
      } catch (error) {
        console.log('Not logged in')
      }
    }
    initializeAuth()
  }, [refresh])

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
