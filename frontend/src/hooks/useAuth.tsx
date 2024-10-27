import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User } from 'shared'
import { authApi } from '../utils/api'
import { AuthError, AuthTokens } from '../types/types'
import { jwtDecode } from 'jwt-decode'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
}

interface JwtPayload {
  exp: number
  [key: string]: number | string | undefined
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_TOKEN_KEY = 'accessToken'

const calculateRefreshTime = (token: string): number => {
  try {
    const decoded = jwtDecode<JwtPayload>(token)
    const expiryTime = decoded.exp * 1000
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime

    if (timeUntilExpiry <= 60000) {
      return 0
    }

    return timeUntilExpiry - 60000
  } catch {
    return 14 * 60 * 1000
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const accessTokenRef = useRef<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY))
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  const clearAuth = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
    accessTokenRef.current = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
  }, [])

  const setupRefreshToken = useCallback(
    (tokens: AuthTokens) => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      const refreshTime = calculateRefreshTime(tokens.accessToken)

      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          const newTokens = await authApi.refreshToken()
          accessTokenRef.current = newTokens.accessToken
          localStorage.setItem(ACCESS_TOKEN_KEY, newTokens.accessToken)
          setupRefreshToken(newTokens)
        } catch {
          clearAuth()
        }
      }, refreshTime)
    },
    [clearAuth]
  )

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        setError(null)
        setIsLoading(true)

        const response = await authApi.login(username, password)

        accessTokenRef.current = response.accessToken
        localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)

        setUser(response.user)
        setIsAuthenticated(true)
        setupRefreshToken(response)
      } catch (err) {
        clearAuth()
        setError(err as AuthError)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [clearAuth, setupRefreshToken]
  )

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      await authApi.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      clearAuth()
      setIsLoading(false)
    }
  }, [clearAuth])

  // Initial auth check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        if (accessTokenRef.current) {
          const user = await authApi.getProfile(accessTokenRef.current)
          setUser(user)
          setIsAuthenticated(true)

          // Attempt to refresh token
          const tokens = await authApi.refreshToken()
          accessTokenRef.current = tokens.accessToken
          localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
          setupRefreshToken(tokens)
        }
      } catch {
        clearAuth()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [clearAuth, setupRefreshToken])

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
