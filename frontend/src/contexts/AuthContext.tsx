import { useReducer, useCallback, createContext, useContext, ReactNode, useEffect } from 'react'
import api from '../api/axios'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import { AxiosError } from 'axios'

// Types
interface AuthResponse extends JwtPayload {
  username?: string
  companyId?: string
  role?: string
}

export interface AuthState {
  user: string | null
  role: string | null
  isLoading: boolean
  companyId: number | undefined
  error: string | null
}

export interface AuthContextType extends AuthState {
  login: (username: string, password: string, companyId: number) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

// Initial state
const initialState: AuthState = {
  user: null,
  role: null,
  isLoading: false,
  companyId: undefined,
  error: null,
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: string; role: string; companyId?: number } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        role: action.payload.role,
        companyId: action.payload.companyId,
        error: null,
      }
    case 'AUTH_FAILURE':
      return { ...state, isLoading: false, error: action.payload }
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refresh: async () => {},
})

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = useCallback(async (username: string, password: string, companyId?: number) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const payload = companyId ? { username, password, companyId } : { username, password }
      const response = await api.post('/auth/login', payload)

      sessionStorage.setItem('accessToken', response.data.accessToken)

      const decoded = jwtDecode<AuthResponse>(response.data.accessToken)

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: decoded.username || '',
          role: decoded.role || '',
          companyId: decoded.companyId ? parseInt(decoded.companyId) : undefined,
        },
      })
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      let errorMessage = 'An unexpected error occurred'

      if (axiosError.response) {
        if (axiosError.response.status === 401) {
          errorMessage = 'Invalid username or password'
        } else if (axiosError.response.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      }

      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      throw new Error(errorMessage)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, username: string) => {
    dispatch({ type: 'AUTH_START' })
    try {
      await api.post('/auth/register', { email, password, username })
    } catch (error) {
      const errorMessage = (error as Error).message || 'Registration failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      throw new Error(errorMessage)
    }
  }, [])

  const refresh = useCallback(async () => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await api.get('/auth/refresh')

      if (!response.data.accessToken) {
        throw new Error('No access token returned')
      }

      const decoded = jwtDecode<AuthResponse>(response.data.accessToken)

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: decoded.username || '',
          role: decoded.role || '',
          companyId: decoded.companyId ? parseInt(decoded.companyId) : undefined,
        },
      })

      sessionStorage.setItem('accessToken', response.data.accessToken)
      return response.data.accessToken
    } catch (error) {
      sessionStorage.removeItem('accessToken')
      dispatch({ type: 'AUTH_LOGOUT' })
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    dispatch({ type: 'AUTH_START' })
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      sessionStorage.removeItem('accessToken')
      dispatch({ type: 'AUTH_LOGOUT' })
    }
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refresh()
      } catch (error) {
        console.log('Failed to refresh token:', error)
      }
    }
    initializeAuth()
  }, [refresh])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refresh,
      }}
    >
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
