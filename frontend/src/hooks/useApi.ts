// Better TypeScript in useApi.ts
import { useState, useCallback } from 'react'
import { AxiosResponse, AxiosRequestConfig, Method } from 'axios'
import axiosInstance from '../api/axios'
import { ApiError, formatApiError } from '../utils/errorUtils'

interface ApiState<T> {
  data: T | null
  isLoading: boolean
  error: ApiError | null
}

type ApiResponse<T> = {
  data: T
  success: boolean
  message?: string
}

export function useApi<T>(initialData: T | null = null) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  })

  const execute = useCallback(
    async <R = T>(
      url: string,
      method: Method = 'get',
      data?: unknown,
      config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>
    ): Promise<ApiResponse<R>> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response: AxiosResponse<ApiResponse<R>> = await axiosInstance.request({
          url,
          method,
          data,
          ...config,
        })

        setState((prev) => ({
          ...prev,
          isLoading: false,
          data: response.data.data as unknown as T,
          error: null,
        }))

        return response.data
      } catch (error) {
        const formattedError = formatApiError(error)
        setState((prev) => ({ ...prev, isLoading: false, error: formattedError }))
        throw formattedError
      }
    },
    []
  )

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null,
    })
  }, [initialData])

  return {
    ...state,
    execute,
    reset,
  }
}
