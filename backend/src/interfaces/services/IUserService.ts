import { User, UserRefreshToken } from 'shared'
import { Result } from '../../utils/Result'

export interface IUserService {
  register(email: string, password: string, username: string): Promise<Result<User, Error>>
  login(
    username: string,
    password: string,
    companyId: number
  ): Promise<
    Result<{ accessToken: string; refreshToken: string; username: string; role: string; companyId: number }, Error>
  >
  getUserById(id: number): Promise<Result<User, Error>>
  updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<Result<User, Error>>
  deleteUser(id: number): Promise<Result<User, Error>>
  refreshAccessToken(refreshToken: string): Promise<Result<{ accessToken: string; refreshToken: string }, Error>>
  revokeRefreshToken(token: string): Promise<Result<UserRefreshToken, Error>>
  getUserByUsername(username: string): Promise<Result<User, Error>>
}
