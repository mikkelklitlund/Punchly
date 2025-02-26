import axios, { AxiosRequestConfig } from 'axios'
import { formatApiError } from '../utils/errorUtils'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true,
})

const refreshTokenRequest = axios.create({
  baseURL: 'http://localhost:4000/api',
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
        const response = await refreshTokenRequest.get('/auth/refresh')

        const newAccessToken = response.data.accessToken

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`

        sessionStorage.setItem('accessToken', newAccessToken)

        processQueue(null, newAccessToken)
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        const errorObj = refreshError as Error
        processQueue(errorObj, null)
        return Promise.reject(errorObj)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      const formattedError = formatApiError(error)

      // For example, showing a toast for server errors
      if (formattedError.status >= 500) {
        // Access toast service or dispatch to error store
        console.error('Server error:', formattedError.message)
      }

      return Promise.reject(formattedError)
    }

    return Promise.reject(error)
  }
)

axiosInstance.interceptors.request.use(
  (config) => {
    if (!config.url?.includes('/auth/')) {
      const token = sessionStorage.getItem('accessToken')
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

export default axiosInstance
