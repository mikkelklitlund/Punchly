import { UserDTO } from 'shared'

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface LoginResponse extends AuthTokens {
  user: UserDTO
}

export interface AuthError extends Error {
  code?: string
  status?: number
}
