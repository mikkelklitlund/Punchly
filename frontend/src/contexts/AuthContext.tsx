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
  getStoredToken,
} from '../api/axios'
import { Role } from 'shared'

// ---------------------
// Error Class & Types
// ---------------------

export class PasswordChangeRequiredError extends Error {
  constructor(message = 'Password change is required.') {
    super(message)
    this.name = 'PasswordChangeRequiredError'
  }
}

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
  register: (email: string, password: string, username: string, shouldChangePassword: boolean) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
}

// ---------------------
// State & Reducer
// ---------------------

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
  | { type: 'AUTH_PASSWORD_REQUIRED'; payload: { user: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'FORCE_LOGOUT' }
  | { type: 'AUTH_INITIALIZED' }

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null }
    case 'AUTH_SUCCESS':
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
    case 'AUTH_PASSWORD_REQUIRED':
      return {
        ...state,
        user: action.payload.user,
        role: null,
        isLoading: false,
        error: null,
      }
    case 'AUTH_LOGOUT':
    case 'FORCE_LOGOUT':
      return { ...initialState, isLoading: false }
    case 'AUTH_INITIALIZED':
      return state.isLoading ? { ...state, isLoading: false } : state
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
  changePassword: async () => {},
})

const handleAxiosError = (error: unknown): string => {
  const axiosError = error as AxiosError<{ message?: string }>
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message
  }
  if (axiosError.response?.status === 401) {
    return 'Invalid username or password'
  }
  return 'An unexpected error occurred'
}

// ---------------------
// AuthProvider Component
// ---------------------

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const updateAuthContext = useCallback((user: string, role: Role, companyId?: number) => {
    dispatch({
      type: 'AUTH_SUCCESS',
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

      if (data.shouldChangePassword) {
        throw new PasswordChangeRequiredError()
      }

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
      if (error instanceof PasswordChangeRequiredError) {
        const accessToken = getStoredToken()
        if (!accessToken) {
          dispatch({ type: 'AUTH_FAILURE', payload: 'Login failed due to token error.' })
          throw new Error('Token missing after password change requirement detected.')
        }

        const decoded = jwtDecode<AuthResponse>(accessToken)

        dispatch({ type: 'AUTH_PASSWORD_REQUIRED', payload: { user: decoded.username || username } })

        throw error
      }
      const errorMessage = handleAxiosError(error)
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
      throw new Error(errorMessage)
    }
  }, [])

  const register = useCallback(
    async (email: string, password: string, username: string, shouldChangePassword: boolean) => {
      dispatch({ type: 'AUTH_START' })
      try {
        await authService.register(email, password, username, shouldChangePassword)
      } catch (error) {
        const errorMessage = handleAxiosError(error) || 'Registration failed'
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage })
        throw new Error(errorMessage)
      }
    },
    []
  )

  const changePassword = useCallback(async (newPassword: string) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const storedToken = getStoredToken()
      if (!storedToken) {
        throw new Error('No token found')
      }

      const decoded = jwtDecode<AuthResponse>(storedToken)
      const username = decoded.username || ''
      const companyId = decoded.companyId!

      await authService.changePassword(newPassword)

      const { accessToken } = await authService.login(username, newPassword, companyId)

      setStoredToken(accessToken)
      const newDecoded = jwtDecode<AuthResponse>(accessToken)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: newDecoded.username || '',
          role: newDecoded.role || Role.COMPANY,
          companyId: newDecoded.companyId,
        },
      })
    } catch (error) {
      const errorMessage = handleAxiosError(error)
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
      } catch {
        console.log('Failed to refresh token, falling back to unauthenticated state.')
      } finally {
        dispatch({ type: 'AUTH_INITIALIZED' })
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
        changePassword,
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
