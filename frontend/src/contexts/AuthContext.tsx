import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react'
import axios from '../api/axios'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import { AxiosError } from 'axios'

interface AuthResponse extends JwtPayload {
  username?: string
  companyId?: string
}

export interface AuthContextType {
  user: string | null
  login: (username: string, password: string, companyId: number) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  isLoading: boolean
  companyId: number | undefined
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export let accessTokenGlobal: string | null

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [companyId, setCompanyId] = useState<number | undefined>(undefined)

  const login = useCallback(async (username: string, password: string, companyId: number) => {
    setIsLoading(true)
    try {
      const response = await axios.post('/auth/login', { username, password, companyId }, { withCredentials: true })
      accessTokenGlobal = response.data.accessToken
      sessionStorage.setItem('accessToken', response.data.accessToken)
      setUser(response.data.username)
      setCompanyId(response.data.companyId)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>

      if (axiosError.response) {
        const { status, data } = axiosError.response

        if (status === 401) {
          throw new Error('Forkert brugernavn eller password')
        } else {
          throw new Error(data?.message || 'Der skete en uventet fejl. Prøv igen.')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, username: string) => {
    setIsLoading(true)
    try {
      await axios.post('/auth/register', { email, password, username })
    } catch (error) {
      throw new Error((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const response = await axios.get('/auth/refresh', { withCredentials: true })
      accessTokenGlobal = response.data.accessToken

      const decoded = jwtDecode(response.data.accessToken) as AuthResponse
      if (decoded.username) {
        setUser(decoded.username)
      }
      if (decoded.companyId) {
        const parsed = parseInt(decoded.companyId)
        if (!isNaN(parsed)) {
          setCompanyId(parsed)
        }
      }
      return response.data.accessToken
    } catch (error) {
      setUser(null)
      accessTokenGlobal = null
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      accessTokenGlobal = null
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)
      try {
        await refresh()
      } catch {
        /* Not logged in */
      } finally {
        setIsLoading(false)
      }
    }
    initializeAuth()
  }, [refresh])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refresh, isLoading, companyId }}>
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
