import { JwtPayload } from 'jsonwebtoken'
import { User } from 'shared'
import { Result } from '../../utils/Result'

export interface IUserService {
  register(email: string, password: string, username: string): Promise<Result<User, Error>>
  login(
    username: string,
    password: string
  ): Promise<Result<{ accessToken: string; refreshToken: string; user: User }, Error>>
  getUserById(id: number): Promise<Result<User, Error>>
  updateUser(id: number, data: Partial<Omit<User, 'id'>>): Promise<Result<User, Error>>
  deleteUser(id: number): Promise<Result<User, Error>>
  refreshAccessToken(refreshToken: string): Promise<Result<string, Error>>
  validateAccessToken(token: string): Result<JwtPayload, Error>
}
