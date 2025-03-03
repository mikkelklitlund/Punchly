import axios from 'axios'

export type ApiError = {
  status: number
  message: string
  originalError: unknown
}

export function formatApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 0
    const message = error.response?.data?.message || error.message || 'An unknown error occurred'
    return { status, message, originalError: error }
  }

  const message = error instanceof Error ? error.message : 'An unknown error occurred'
  return { status: 0, message, originalError: error }
}
