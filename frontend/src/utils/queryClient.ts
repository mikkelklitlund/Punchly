import { QueryClient } from '@tanstack/react-query'

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    if ('status' in error) {
      const s = (error as { status?: unknown }).status
      if (typeof s === 'number') return s
    }
    if ('response' in error) {
      const res = (error as { response?: { status?: unknown } }).response
      const s = res?.status
      if (typeof s === 'number') return s
    }
  }
  return undefined
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        const status = getHttpStatus(error)
        return typeof status === 'number' && status >= 500 ? failureCount < 2 : false
      },
    },
  },
})

export default queryClient
