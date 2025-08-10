import axiosInstance from '../api/axios'
import { AuthTokens } from '../types/types'

export const authService = {
  login: async (username: string, password: string, companyId?: number): Promise<AuthTokens> => {
    const payload = companyId ? { username, password, companyId } : { username, password }
    const response = await axiosInstance.post('/auth/login', payload)
    return response.data
  },

  register: async (email: string, password: string, username: string): Promise<void> => {
    await axiosInstance.post('/auth/register', { email, password, username })
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout')
  },

  refresh: async (): Promise<AuthTokens> => {
    const response = await axiosInstance.post('/auth/refresh')
    return response.data
  },
}
