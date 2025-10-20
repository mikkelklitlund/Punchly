import { Role } from 'shared'

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface LoginResponse extends AuthTokens {
  username: string
  role: Role
  companyId: number
  shouldChangePassword: boolean
}

export interface AuthError extends Error {
  code?: string
  status?: number
}
