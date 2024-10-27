import { User } from 'shared'
import { AuthError, AuthTokens, LoginResponse } from '../types/types'

const API_BASE_URL = 'http://127.0.0.1:4000/api'

export const authApi = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error: AuthError = new Error('Login failed')
      error.status = response.status
      throw error
    }

    return await response.json()
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  },

  async refreshToken(): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      const error: AuthError = new Error('Token refresh failed')
      error.status = response.status
      throw error
    }

    return await response.json()
  },

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error: AuthError = new Error('Failed to fetch profile')
      error.status = response.status
      throw error
    }

    return await response.json()
  },
}
