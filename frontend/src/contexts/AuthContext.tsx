import { useReducer, useCallback, createContext, useContext, ReactNode, useEffect } from 'react'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import { AxiosError } from 'axios'
import { authService } from '../services/authService'
import {
  setAuthContextUpdater,
  clearAuthContextUpdater,
  setLogoutTrigger,
  removeStoredToken,
  setStoredToken,
} from '../api/axios'
import { Role } from 'shared'

// Types
interface AuthResponse extends JwtPayload {
  username?: string
  companyId?: number
  role?: Role
}

export interface AuthState {
  user: string | null
  role: Role | null
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
  isLoading: true,
  companyId: undefined,
  error: null,
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: string; role: Role; companyId?: number } }
  | { type: 'SILENT_AUTH_SUCCESS'; payload: { user: string; role: Role; companyId?: number } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'FORCE_LOGOUT' }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null }
    case 'AUTH_SUCCESS':
    case 'SILENT_AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.role,
        companyId: action.payload.companyId,
        isLoading: false,
        error: null,
      }
    case 'AUTH_FAILURE':
      return { ...state, isLoading: false, error: action.payload }
    case 'AUTH_LOGOUT':
    case 'FORCE_LOGOUT':
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

  const updateAuthContext = useCallback((user: string, role: Role, companyId?: number) => {
    dispatch({
      type: 'SILENT_AUTH_SUCCESS',
      payload: { user, role, companyId },
    })
  }, [])

  const forceLogout = useCallback(() => {
    removeStoredToken()
    dispatch({ type: 'FORCE_LOGOUT' })
  }, [])

  useEffect(() => {
    setAuthContextUpdater(updateAuthContext)
    setLogoutTrigger(forceLogout)
    return () => clearAuthContextUpdater()
  }, [updateAuthContext, forceLogout])

  const login = useCallback(async (username: string, password: string, companyId: number) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const data = await authService.login(username, password, companyId)

      setStoredToken(data.accessToken)

      const decoded = jwtDecode<AuthResponse>(data.accessToken)

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: decoded.username || '',
          role: decoded.role || Role.COMPANY,
          companyId: decoded.companyId,
        },
      })
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      let errorMessage = 'An unexpected error occurred'

      if (axiosError.response?.status === 401) {
        errorMessage = 'Invalid username or password'
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message
      }

      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      throw new Error(errorMessage)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, username: string) => {
    dispatch({ type: 'AUTH_START' })
    try {
      await authService.register(email, password, username)
    } catch (error) {
      const errorMessage = (error as Error).message || 'Registration failed'
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      throw new Error(errorMessage)
    }
  }, [])

  const refresh = useCallback(async () => {
    dispatch({ type: 'AUTH_START' })
    try {
      const data = await authService.refresh()
      setStoredToken(data.accessToken)

      const decoded = jwtDecode<AuthResponse>(data.accessToken)

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: decoded.username || '',
          role: decoded.role || Role.COMPANY,
          companyId: decoded.companyId,
        },
      })
    } catch (error) {
      removeStoredToken()
      dispatch({ type: 'AUTH_LOGOUT' })
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    dispatch({ type: 'AUTH_START' })
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      removeStoredToken()
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
