import axios, { AxiosRequestConfig } from 'axios'
import { formatApiError } from '../utils/errorUtils'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import { Role } from 'shared'

interface AuthResponse extends JwtPayload {
  username?: string
  companyId?: number
  role?: Role
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
const STORAGE_TYPE = (import.meta.env.VITE_STORAGE_TYPE as 'localStorage' | 'sessionStorage') || 'localStorage'
import { jwtDecode, JwtPayload } from 'jwt-decode'
import { Role } from 'shared'

interface AuthResponse extends JwtPayload {
  username?: string
  companyId?: number
  role?: Role
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
const STORAGE_TYPE = (import.meta.env.VITE_STORAGE_TYPE as 'localStorage' | 'sessionStorage') || 'localStorage'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  baseURL: API_BASE_URL,
  withCredentials: true,
})

const refreshTokenRequest = axios.create({
  baseURL: API_BASE_URL,
  baseURL: API_BASE_URL,
  withCredentials: true,
})

interface FailedRequest {
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
  config: AxiosRequestConfig
}

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}

let isRefreshing = false
let failedQueue: FailedRequest[] = []

let authContextUpdater: ((user: string, role: Role, companyId?: number) => void) | null = null
let logoutTrigger: (() => void) | null = null

export const setAuthContextUpdater = (updater: (user: string, role: Role, companyId?: number) => void) => {
  authContextUpdater = updater
}

export const setLogoutTrigger = (trigger: () => void) => {
  logoutTrigger = trigger
}

export const clearAuthContextUpdater = () => {
  authContextUpdater = null
  logoutTrigger = null
}

export const getStorage = () => {
  return STORAGE_TYPE === 'localStorage' ? localStorage : sessionStorage
}

export const getStoredToken = (): string | null => {
  return getStorage().getItem('accessToken')
}

export const setStoredToken = (token: string): void => {
  getStorage().setItem('accessToken', token)
}

export const removeStoredToken = (): void => {
  getStorage().removeItem('accessToken')
}

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token)
    } else {
      prom.reject(error)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
          .then((token) => {
            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      isRefreshing = true

      try {
        const response = await refreshTokenRequest.post('/auth/refresh')
        const response = await refreshTokenRequest.post('/auth/refresh')
        const newAccessToken = response.data.accessToken

        setStoredToken(newAccessToken)

        if (authContextUpdater) {
          try {
            const decoded = jwtDecode<AuthResponse>(newAccessToken)
            authContextUpdater(decoded.username || '', decoded.role || Role.COMPANY, decoded.companyId)
          } catch (decodeError) {
            console.error('Failed to decode refreshed token:', decodeError)
          }
        }

        setStoredToken(newAccessToken)

        if (authContextUpdater) {
          try {
            const decoded = jwtDecode<AuthResponse>(newAccessToken)
            authContextUpdater(decoded.username || '', decoded.role || Role.COMPANY, decoded.companyId)
          } catch (decodeError) {
            console.error('Failed to decode refreshed token:', decodeError)
          }
        }

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`

        processQueue(null, newAccessToken)
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        const errorObj = refreshError as Error
        processQueue(errorObj, null)

        removeStoredToken()

        if (logoutTrigger) {
          logoutTrigger()
        }

        removeStoredToken()

        if (logoutTrigger) {
          logoutTrigger()
        }

        return Promise.reject(errorObj)
      } finally {
        isRefreshing = false
      }
    }

    const formattedError = formatApiError(error)
    const formattedError = formatApiError(error)

    if (formattedError.status >= 500) {
      console.error('Server error:', formattedError.message)
    }
    if (formattedError.status >= 500) {
      console.error('Server error:', formattedError.message)
    }

    return Promise.reject(formattedError)
    return Promise.reject(formattedError)
  }
)

axiosInstance.interceptors.request.use(
  (config) => {
    if (!config.url?.includes('/auth/')) {
      const token = getStoredToken()
      const token = getStoredToken()
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export { isTokenExpired }
export default axiosInstance
