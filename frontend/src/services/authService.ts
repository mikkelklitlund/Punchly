import { CompanyDTO, Role } from 'shared'
import axiosInstance from '../api/axios'
import { AuthTokens, LoginResponse } from '../types/types'

export const authService = {
  async login(username: string, password: string, companyId: number): Promise<LoginResponse> {
    const payload = { username, password, companyId }
    const response = await axiosInstance.post('/auth/login', payload)
    return response.data
  },

  async register(
    email: string | undefined,
    password: string,
    username: string,
    shouldChangePassword: boolean,
    role: Role
  ): Promise<void> {
    await axiosInstance.post('/auth/register', {
      email,
      password,
      username,
      shouldChangePassword,
      role,
    })
  },

  async logout(): Promise<void> {
    await axiosInstance.post('/auth/logout')
  },

  async refresh(): Promise<AuthTokens> {
    const response = await axiosInstance.post('/auth/refresh')
    return response.data
  },

  async getUserCompanies(username: string): Promise<CompanyDTO[]> {
    const response = await axiosInstance.post('/auth/companies-for-user', { username })
    return response.data.companies
  },

  async changePassword(newPassword: string): Promise<void> {
    await axiosInstance.post('/auth/change-password', { newPassword })
  },
}
